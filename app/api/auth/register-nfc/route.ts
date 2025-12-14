import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";
import { registerNfcSchema } from "@/lib/api/validation";
import {
	badRequest,
	unauthorized,
	conflict,
	serverError,
	createSuccessResponse,
} from "@/lib/api/errors";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/auth/register-nfc
 * NFCカードとユーザーを紐付ける
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
		const validationResult = registerNfcSchema.safeParse(body);

		if (!validationResult.success) {
			return badRequest("リクエストが不正です", {
				errors: validationResult.error.errors,
			});
		}

		const { nfcCardId, userId } = validationResult.data;

		// 権限チェック（ユーザー自身のみ登録可能）
		if (auth.type === "user" && auth.uid !== userId) {
			return unauthorized("他のユーザーのNFCカードは登録できません");
		}

		// NFCカードが既に登録されていないかチェック
		const existingNfcQuery = await adminDb
			.collection("users")
			.where("nfcId", "==", nfcCardId)
			.limit(1)
			.get();

		if (!existingNfcQuery.empty) {
			const existingUser = existingNfcQuery.docs[0];
			// 同じユーザーが再登録しようとしている場合はOK
			if (existingUser.id !== userId) {
				return conflict("このカードは既に登録されています");
			}
		}

		// ユーザーの存在確認
		const userRef = adminDb.collection("users").doc(userId);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			return badRequest("ユーザーが見つかりません");
		}

		// NFCカードIDを更新
		await userRef.update({
			nfcId: nfcCardId,
			updatedAt: FieldValue.serverTimestamp(),
		});

		// 更新後のユーザー情報を取得
		const updatedUserDoc = await userRef.get();
		const userData = updatedUserDoc.data();

		return createSuccessResponse({
			message: "NFCカードが登録されました",
			user: {
				uid: userId,
				displayName: userData?.displayName || "不明なユーザー",
				nfcCardId,
			},
		});
	} catch (error) {
		console.error("NFC登録エラー:", error);
		return serverError();
	}
}

