import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireUserAuth } from "@/lib/api/auth";
import {
	badRequest,
	unauthorized,
	serverError,
	createSuccessResponse,
} from "@/lib/api/errors";
import type { PointTransactionType } from "@/types/point";

/**
 * GET /api/points/history?userId=user_uid&limit=50&type=all
 * ユーザーのポイント履歴を取得
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
		const typeFilter = searchParams.get("type") || "all";

		if (!userId) {
			return badRequest("userIdは必須です");
		}

		// 権限チェック（自分の履歴のみ閲覧可能）
		if (auth.uid !== userId) {
			return unauthorized("他のユーザーの履歴は閲覧できません");
		}

		const limit = Math.min(parseInt(limitStr, 10), 100);

		// ポイント履歴を取得
		let query = adminDb
			.collection("pointTransactions")
			.where("userId", "==", userId)
			.orderBy("createdAt", "desc")
			.limit(limit);

		// タイプフィルター適用
		if (typeFilter !== "all") {
			query = query.where("type", "==", typeFilter);
		}

		const snapshot = await query.get();

		const history = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				amount: data.amount,
				type: data.type as PointTransactionType,
				description: data.description || "",
				referenceId: data.referenceId || null,
				createdAt: data.createdAt?.toDate().toISOString() || null,
			};
		});

		return createSuccessResponse({
			userId,
			history,
			total: history.length,
		});
	} catch (error) {
		console.error("ポイント履歴取得エラー:", error);
		return serverError();
	}
}

