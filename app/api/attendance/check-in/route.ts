import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";
import { checkInSchema } from "@/lib/api/validation";
import {
	badRequest,
	unauthorized,
	notFound,
	serverError,
	createSuccessResponse,
} from "@/lib/api/errors";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/attendance/check-in
 * チェックイン（入室）
 */
export async function POST(req: NextRequest) {
	try {
		// 認証チェック
		const auth = await verifyAuth(req);
		if (!auth.authorized) {
			return unauthorized(auth.error);
		}

		// リクエストボディの取得とバリデーション
		const body = await req.json();
		const validationResult = checkInSchema.safeParse(body);

		if (!validationResult.success) {
			return badRequest("リクエストが不正です", {
				errors: validationResult.error.errors,
			});
		}

		const { userId } = validationResult.data;

		// 権限チェック（ユーザー認証の場合、自分のチェックインのみ可能）
		if (auth.type === "user" && auth.uid !== userId) {
			return unauthorized("他のユーザーのチェックインはできません");
		}

		// ユーザーの存在確認
		const userRef = adminDb.collection("users").doc(userId);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			return notFound("ユーザーが見つかりません");
		}

		const userData = userDoc.data();

		// 在室状態を更新
		await userRef.update({
			isPresent: true,
			lastPresenceUpdate: FieldValue.serverTimestamp(),
		});

		// チェックイン記録を作成
		await adminDb.collection("attendances").add({
			userId,
			displayName: userData?.displayName || "不明なユーザー",
			type: "check_in",
			timestamp: FieldValue.serverTimestamp(),
		});

		return createSuccessResponse({
			message: "チェックインしました",
			attendance: {
				userId,
				displayName: userData?.displayName || "不明なユーザー",
				status: "in",
				checkInTime: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("チェックインエラー:", error);
		return serverError();
	}
}

