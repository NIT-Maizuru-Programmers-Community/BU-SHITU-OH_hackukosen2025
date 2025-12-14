import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { serverError, createSuccessResponse } from "@/lib/api/errors";

/**
 * GET /api/ranking?limit=100
 * ポイントランキングを取得
 */
export async function GET(req: NextRequest) {
	try {
		// クエリパラメータを取得
		const { searchParams } = new URL(req.url);
		const limitStr = searchParams.get("limit") || "100";
		const limit = Math.min(parseInt(limitStr, 10), 500);

		// ポイント順にユーザーを取得
		const usersQuery = await adminDb
			.collection("users")
			.orderBy("points", "desc")
			.limit(limit)
			.get();

		const ranking = usersQuery.docs.map((doc, index) => {
			const userData = doc.data();
			return {
				rank: index + 1,
				userId: doc.id,
				displayName: userData.displayName || "不明なユーザー",
				photoURL: userData.photoURL || null,
				totalPoints: userData.points || 0,
				isPresident: index === 0, // 1位が社長
			};
		});

		return createSuccessResponse({
			ranking,
			total: ranking.length,
			updatedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error("ランキング取得エラー:", error);
		return serverError();
	}
}

