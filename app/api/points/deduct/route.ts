import { NextRequest } from "next/server";
import { requireHardwareAuth } from "@/lib/api/auth";
import { deductPointsSchema } from "@/lib/api/validation";
import { deductPoints, getUserBalance } from "@/lib/api/points";
import {
	badRequest,
	unauthorized,
	serverError,
	createSuccessResponse,
	createErrorResponse,
	ApiErrorCode,
} from "@/lib/api/errors";

/**
 * POST /api/points/deduct
 * ハードウェアから直接ポイントを減算
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
		const validationResult = deductPointsSchema.safeParse(body);

		if (!validationResult.success) {
			return badRequest("リクエストが不正です", {
				errors: validationResult.error.errors,
			});
		}

		const { userId, amount, type, description, relatedId } =
			validationResult.data;

		// ポイント減算処理
		try {
			const result = await deductPoints(
				userId,
				amount,
				type,
				description,
				relatedId
			);

			return createSuccessResponse({
				message: "ポイントを使用しました",
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
			if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
				// ポイント不足エラー
				const balance = await getUserBalance(userId);
				return createErrorResponse(
					"ポイントが不足しています",
					ApiErrorCode.INSUFFICIENT_POINTS,
					400,
					{
						currentBalance: balance.totalPoints,
						required: amount,
					}
				);
			}
			throw error;
		}
	} catch (error) {
		console.error("ポイント減算エラー:", error);
		if (
			error instanceof Error &&
			error.message === "ユーザーが見つかりません"
		) {
			return badRequest(error.message);
		}
		return serverError();
	}
}

