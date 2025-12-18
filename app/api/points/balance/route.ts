import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api/auth";
import { getUserBalance } from "@/lib/api/points";
import {
	badRequest,
	unauthorized,
	serverError,
	createSuccessResponse,
} from "@/lib/api/errors";

/**
 * GET /api/points/balance?userId=user_uid
 * ユーザーのポイント残高を取得
 */
export async function GET(req: NextRequest) {
	try {
		// 認証チェック
		const auth = await verifyAuth(req);
		if (!auth.authorized) {
			return unauthorized(auth.error);
		}

		// クエリパラメータからuserIdを取得
		const { searchParams } = new URL(req.url);
		const userId = searchParams.get("userId");

		if (!userId) {
			return badRequest("userIdは必須です");
		}

		// 権限チェック（ユーザー認証の場合、自分のポイントのみ閲覧可能）
		if (auth.type === "user" && auth.uid !== userId) {
			return unauthorized("他のユーザーのポイントは閲覧できません");
		}

		// ポイント残高を取得
		const balance = await getUserBalance(userId);

		return createSuccessResponse({
			userId: balance.userId,
			displayName: balance.displayName,
			totalPoints: balance.totalPoints,
			updatedAt: balance.updatedAt?.toISOString() || null,
		});
	} catch (error) {
		console.error("ポイント残高取得エラー:", error);
		if (
			error instanceof Error &&
			error.message === "ユーザーが見つかりません"
		) {
			return badRequest(error.message);
		}
		return serverError();
	}
}


