import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireHardwareAuth } from "@/lib/api/auth";
import { raceBetSchema } from "@/lib/api/validation";
import { deductPoints } from "@/lib/api/points";
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
 * POST /api/race/bet
 * レースにベットする（ハードウェア用）
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
		const validationResult = raceBetSchema.safeParse(body);

		if (!validationResult.success) {
			return badRequest("リクエストが不正です", {
				errors: validationResult.error.issues,
			});
		}

		const { userId, raceId, targetCharacterId, amount } = validationResult.data;

		// レースの存在確認
		const raceRef = adminDb.collection("races").doc(raceId);
		const raceDoc = await raceRef.get();

		if (!raceDoc.exists) {
			return notFound("レースが見つかりません");
		}

		const raceData = raceDoc.data();

		// レースの状態チェック
		if (raceData?.status === "completed" || raceData?.winnerCharacterId) {
			return createErrorResponse(
				"レースは既に締め切られています",
				ApiErrorCode.RACE_CLOSED,
				400
			);
		}

		// 対象キャラクターが参加者に含まれているかチェック
		const characters = raceData?.characters || [];
		const targetCharacter = characters.find(
			(c: any) => c.characterId === targetCharacterId
		);

		if (!targetCharacter) {
			return badRequest("指定されたキャラクターはレースに参加していません");
		}

		// ポイント減算処理
		try {
			const deductResult = await deductPoints(
				userId,
				amount,
				"race_bet",
				`レースベット: ${targetCharacter.name}に${amount}pt`,
				raceId
			);

			// ベット記録を作成
			const betRef = await adminDb.collection("bets").add({
				raceId,
				userId,
				targetCharacterId,
				points: amount,
				oddsAtBet: targetCharacter.odds || 1.0,
				createdAt: FieldValue.serverTimestamp(),
			});

			// レースの総ベット情報を更新
			await raceRef.update({
				totalBets: FieldValue.increment(1),
				totalBetPoints: FieldValue.increment(amount),
				characters: characters.map((c: any) =>
					c.characterId === targetCharacterId
						? {
								...c,
								totalBets: (c.totalBets || 0) + 1,
								totalBetPoints: (c.totalBetPoints || 0) + amount,
						  }
						: c
				),
			});

			return createSuccessResponse({
				message: "ベットしました",
				bet: {
					id: betRef.id,
					raceId,
					userId,
					targetCharacterId,
					amount,
					createdAt: new Date().toISOString(),
				},
				newBalance: deductResult.newBalance,
			});
		} catch (error) {
			if (error instanceof Error && error.message === "INSUFFICIENT_POINTS") {
				return createErrorResponse(
					"ポイントが不足しています",
					ApiErrorCode.INSUFFICIENT_POINTS,
					400
				);
			}
			throw error;
		}
	} catch (error) {
		console.error("レースベットエラー:", error);
		return serverError();
	}
}
