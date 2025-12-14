import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";
import { checkOutSchema } from "@/lib/api/validation";
import {
	badRequest,
	unauthorized,
	notFound,
	serverError,
	createSuccessResponse,
} from "@/lib/api/errors";
import { FieldValue } from "firebase-admin/firestore";

/**
 * 在室時間を計算（分単位）
 */
function calculateDuration(checkInTime: Date, checkOutTime: Date): number {
	const durationMs = checkOutTime.getTime() - checkInTime.getTime();
	return Math.floor(durationMs / (1000 * 60)); // 分に変換
}

/**
 * POST /api/attendance/check-out
 * チェックアウト（退室）
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
		const validationResult = checkOutSchema.safeParse(body);

		if (!validationResult.success) {
			return badRequest("リクエストが不正です", {
				errors: validationResult.error.errors,
			});
		}

		const { userId } = validationResult.data;

		// 権限チェック（ユーザー認証の場合、自分のチェックアウトのみ可能）
		if (auth.type === "user" && auth.uid !== userId) {
			return unauthorized("他のユーザーのチェックアウトはできません");
		}

		// ユーザーの存在確認
		const userRef = adminDb.collection("users").doc(userId);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			return notFound("ユーザーが見つかりません");
		}

		const userData = userDoc.data();

		// 最後のチェックイン記録を取得
		const lastCheckInQuery = await adminDb
			.collection("attendances")
			.where("userId", "==", userId)
			.where("type", "==", "check_in")
			.orderBy("timestamp", "desc")
			.limit(1)
			.get();

		let checkInTime = new Date();
		let duration = 0;

		if (!lastCheckInQuery.empty) {
			const lastCheckInData = lastCheckInQuery.docs[0].data();
			checkInTime = lastCheckInData.timestamp?.toDate() || new Date();
			duration = calculateDuration(checkInTime, new Date());
		}

		// 在室状態を更新
		await userRef.update({
			isPresent: false,
			lastPresenceUpdate: FieldValue.serverTimestamp(),
		});

		// チェックアウト記録を作成
		await adminDb.collection("attendances").add({
			userId,
			displayName: userData?.displayName || "不明なユーザー",
			type: "check_out",
			timestamp: FieldValue.serverTimestamp(),
			duration,
		});

		return createSuccessResponse({
			message: "チェックアウトしました",
			attendance: {
				userId,
				displayName: userData?.displayName || "不明なユーザー",
				status: "out",
				checkInTime: checkInTime.toISOString(),
				checkOutTime: new Date().toISOString(),
				duration,
			},
		});
	} catch (error) {
		console.error("チェックアウトエラー:", error);
		return serverError();
	}
}

