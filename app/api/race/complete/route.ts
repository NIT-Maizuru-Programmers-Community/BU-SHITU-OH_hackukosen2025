import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireHardwareAuth } from "@/lib/api/auth";
import { raceCompleteSchema } from "@/lib/api/validation";
import { awardPoints } from "@/lib/api/points";
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
 * POST /api/race/complete
 * レースを完了し、勝者を決定して配当を計算（ハードウェア用）
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
		const validationResult = raceCompleteSchema.safeParse(body);

		if (!validationResult.success) {
			return badRequest("リクエストが不正です", {
				errors: validationResult.error.issues,
			});
		}

		const { raceId, winnerCharacterId, results } = validationResult.data;

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
				"レースは既に完了しています",
				ApiErrorCode.RACE_CLOSED,
				400
			);
		}

		// 勝者キャラクターが参加しているかチェック
		const characters = raceData?.characters || [];
		const winnerCharacter = characters.find(
			(c: any) => c.characterId === winnerCharacterId
		);

		if (!winnerCharacter) {
			return badRequest("指定されたキャラクターはレースに参加していません");
		}

		// 当選ベットの取得
		const betsSnapshot = await adminDb
			.collection("bets")
			.where("raceId", "==", raceId)
			.where("targetCharacterId", "==", winnerCharacterId)
			.get();

		// 配当の計算と実行
		const payoutResults = [];
		const totalBetPoints = raceData?.totalBetPoints || 0;
		const winnerTotalBets = winnerCharacter.totalBetPoints || 1; // 0除算防止

		// オッズの計算 (総ベット額 / 勝者キャラクターへのベット額)
		const odds = Math.max(1.0, totalBetPoints / winnerTotalBets);

		for (const betDoc of betsSnapshot.docs) {
			const betData = betDoc.data();
			const betAmount = betData.points;
			const payout = Math.round(betAmount * odds);
			const profit = payout - betAmount;

			try {
				// 配当を付与
				const result = await awardPoints(
					betData.userId,
					payout,
					"race_win",
					`レース配当: ${winnerCharacter.emoji || ""} ${
						winnerCharacter.name
					}に的中 (${odds.toFixed(2)}倍)`,
					raceId
				);

				payoutResults.push({
					userId: betData.userId,
					betAmount,
					payout,
					profit,
					newBalance: result.newBalance,
				});

				// ベットドキュメントを更新（配当済みマーク）
				await betDoc.ref.update({
					paidOut: true,
					payout,
					odds: odds,
					updatedAt: FieldValue.serverTimestamp(),
				});
			} catch (error) {
				console.error(`配当付与エラー (userId: ${betData.userId}):`, error);
			}
		}

		// レースドキュメントを更新
		const updateData: any = {
			winnerCharacterId,
			winnerName: winnerCharacter.name,
			winnerEmoji: winnerCharacter.emoji || "",
			status: "completed",
			finalOdds: odds,
			totalPayouts: payoutResults.reduce((sum, p) => sum + p.payout, 0),
			completedAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp(),
		};

		// 結果データがあれば追加
		if (results && results.length > 0) {
			updateData.results = results;
			// キャラクターの順位を更新
			updateData.characters = characters.map((c: any) => {
				const result = results.find((r) => r.characterId === c.characterId);
				return result
					? {
							...c,
							rank: result.rank,
					  }
					: c;
			});
		}

		await raceRef.update(updateData);

		return createSuccessResponse({
			message: "レースが完了しました",
			race: {
				id: raceId,
				winnerCharacterId,
				winnerName: winnerCharacter.name,
				winnerEmoji: winnerCharacter.emoji || "",
				odds: parseFloat(odds.toFixed(2)),
				totalBets: betsSnapshot.size,
				totalPayouts: payoutResults.reduce((sum, p) => sum + p.payout, 0),
			},
			payouts: payoutResults,
		});
	} catch (error) {
		console.error("レース完了エラー:", error);
		return serverError();
	}
}
