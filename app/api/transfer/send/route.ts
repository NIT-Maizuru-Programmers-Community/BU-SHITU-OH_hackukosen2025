import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireUserAuth } from "@/lib/api/auth";
import { transferSchema } from "@/lib/api/validation";
import { deductPoints, awardPoints } from "@/lib/api/points";
import {
	badRequest,
	unauthorized,
	notFound,
	serverError,
	createSuccessResponse,
	createErrorResponse,
	ApiErrorCode,
} from "@/lib/api/errors";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/transfer/send
 * ポイントを他のユーザーに送金
 */
export async function POST(req: NextRequest) {
	try {
		// ユーザー認証チェック
		const auth = await requireUserAuth(req);
		if (!auth.authorized) {
			return unauthorized(auth.error);
		}

		const senderId = auth.uid;

		// リクエストボディの取得とバリデーション
		const body = await req.json();
		const validationResult = transferSchema.safeParse(body);

		if (!validationResult.success) {
			return badRequest("リクエストが不正です", {
				errors: validationResult.error.issues,
			});
		}

		const { receiverId, amount, message } = validationResult.data;

		// 自分自身への送金を防ぐ
		if (senderId === receiverId) {
			return badRequest("自分自身にポイントを送金することはできません");
		}

		// 送信者の情報を取得
		const senderDoc = await adminDb.collection("users").doc(senderId).get();
		if (!senderDoc.exists) {
			return unauthorized("送信者が見つかりません");
		}
		const senderData = senderDoc.data();

		// 受信者の存在確認
		const receiverDoc = await adminDb.collection("users").doc(receiverId).get();
		if (!receiverDoc.exists) {
			return notFound("受信者が見つかりません");
		}
		const receiverData = receiverDoc.data();

		// 送金処理（トランザクション）
		try {
			// 送信者からポイント減算
			const deductResult = await deductPoints(
				senderId,
				amount,
				"transfer_sent",
				`${receiverData?.displayName || "不明なユーザー"}への送金`,
				receiverId
			);

			// 受信者にポイント付与
			await awardPoints(
				receiverId,
				amount,
				"transfer_received",
				`${senderData?.displayName || "不明なユーザー"}からの送金`,
				senderId
			);

			// 送金記録を作成
			const transferRef = await adminDb.collection("transfers").add({
				senderId,
				senderDisplayName: senderData?.displayName || "不明なユーザー",
				receiverId,
				receiverDisplayName: receiverData?.displayName || "不明なユーザー",
				points: amount,
				message: message || "",
				createdAt: FieldValue.serverTimestamp(),
			});

			return createSuccessResponse({
				message: "送金しました",
				transfer: {
					id: transferRef.id,
					senderId,
					senderName: senderData?.displayName || "不明なユーザー",
					receiverId,
					receiverName: receiverData?.displayName || "不明なユーザー",
					amount,
					message: message || "",
					createdAt: new Date().toISOString(),
				},
				newBalance: deductResult.newBalance,
			});
		} catch (error) {
			if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
				return createErrorResponse(
					"ポイントが不足しています",
					ApiErrorCode.INSUFFICIENT_POINTS,
					400,
					{
						currentBalance: senderData?.points || 0,
						required: amount,
					}
				);
			}
			throw error;
		}
	} catch (error) {
		console.error("送金エラー:", error);
		return serverError();
	}
}
