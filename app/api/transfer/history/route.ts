import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireUserAuth } from "@/lib/api/auth";
import {
	badRequest,
	unauthorized,
	serverError,
	createSuccessResponse,
} from "@/lib/api/errors";

/**
 * GET /api/transfer/history?userId=user_uid&limit=50&direction=all
 * 送金・受信の履歴を取得
 */
export async function GET(req: NextRequest) {
	try {
		// ユーザー認証チェック
		const auth = await requireUserAuth(req);
		if (!auth.authorized) {
			return unauthorized(auth.error);
		}

		// クエリパラメータを取得
		const { searchParams } = new URL(req.url);
		const userId = searchParams.get("userId");
		const limitStr = searchParams.get("limit") || "50";
		const direction = searchParams.get("direction") || "all";

		if (!userId) {
			return badRequest("userIdは必須です");
		}

		// 権限チェック（自分の履歴のみ閲覧可能）
		if (auth.uid !== userId) {
			return unauthorized("他のユーザーの履歴は閲覧できません");
		}

		const limit = Math.min(parseInt(limitStr, 10), 100);

		// 送金履歴を取得
		let transfers: any[] = [];

		if (direction === "all" || direction === "sent") {
			// 送信履歴
			const sentQuery = await adminDb
				.collection("transfers")
				.where("senderId", "==", userId)
				.orderBy("createdAt", "desc")
				.limit(limit)
				.get();

			const sentTransfers = sentQuery.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					senderId: data.senderId,
					senderName: data.senderDisplayName || "不明なユーザー",
					receiverId: data.receiverId,
					receiverName: data.receiverDisplayName || "不明なユーザー",
					amount: data.points,
					message: data.message || "",
					direction: "sent",
					createdAt: data.createdAt?.toDate().toISOString() || null,
				};
			});

			transfers = [...transfers, ...sentTransfers];
		}

		if (direction === "all" || direction === "received") {
			// 受信履歴
			const receivedQuery = await adminDb
				.collection("transfers")
				.where("receiverId", "==", userId)
				.orderBy("createdAt", "desc")
				.limit(limit)
				.get();

			const receivedTransfers = receivedQuery.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					senderId: data.senderId,
					senderName: data.senderDisplayName || "不明なユーザー",
					receiverId: data.receiverId,
					receiverName: data.receiverDisplayName || "不明なユーザー",
					amount: data.points,
					message: data.message || "",
					direction: "received",
					createdAt: data.createdAt?.toDate().toISOString() || null,
				};
			});

			transfers = [...transfers, ...receivedTransfers];
		}

		// 日時でソート
		transfers.sort((a, b) => {
			const dateA = new Date(a.createdAt || 0);
			const dateB = new Date(b.createdAt || 0);
			return dateB.getTime() - dateA.getTime();
		});

		// limit適用
		transfers = transfers.slice(0, limit);

		return createSuccessResponse({
			transfers,
			total: transfers.length,
		});
	} catch (error) {
		console.error("送金履歴取得エラー:", error);
		return serverError();
	}
}

