import { NextRequest } from "next/server";
import { requireHardwareAuth } from "@/lib/api/auth";
import { awardPointsSchema } from "@/lib/api/validation";
import { awardPoints } from "@/lib/api/points";
import {
	badRequest,
	unauthorized,
	serverError,
	createSuccessResponse,
} from "@/lib/api/errors";

/**
 * POST /api/points/award
 * ハードウェアから直接ポイントを付与
 */
export async function POST(req: NextRequest) {
	try {
		// ハードウェア認証チェック
		const auth = await requireHardwareAuth(req);
		if (!auth.authorized) {
			return unauthorized(auth.error);
		}

		// リクエストボディの取得とバリデーション
		const body = await req.json();
		const validationResult = awardPointsSchema.safeParse(body);

		if (!validationResult.success) {
			return badRequest("リクエストが不正です", {
				errors: validationResult.error.issues,
			});
		}

		const { userId, amount, type, description, relatedId } =
			validationResult.data;

		// ポイント付与処理
		const result = await awardPoints(
			userId,
			amount,
			type,
			description,
			relatedId
		);

		return createSuccessResponse({
			message: "ポイントを付与しました",
			transaction: {
				id: result.transactionId,
				userId: result.userId,
				amount: result.amount,
				type: result.type,
				newBalance: result.newBalance,
				createdAt: result.createdAt.toISOString(),
			},
		});
	} catch (error) {
		console.error("ポイント付与エラー:", error);
		if (
			error instanceof Error &&
			error.message === "ユーザーが見つかりません"
		) {
			return badRequest(error.message);
		}
		return serverError();
	}
}
