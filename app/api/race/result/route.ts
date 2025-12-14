import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
	badRequest,
	notFound,
	serverError,
	createSuccessResponse,
} from "@/lib/api/errors";

/**
 * GET /api/race/result?raceId=race_id
 * レースの結果を取得
 */
export async function GET(req: NextRequest) {
	try {
		// クエリパラメータからraceIdを取得
		const { searchParams } = new URL(req.url);
		const raceId = searchParams.get("raceId");

		if (!raceId) {
			return badRequest("raceIdは必須です");
		}

		// レースの取得
		const raceDoc = await adminDb.collection("races").doc(raceId).get();

		if (!raceDoc.exists) {
			return notFound("レースが見つかりません");
		}

		const raceData = raceDoc.data();

		// レースが完了していない場合
		if (!raceData?.winnerId) {
			return createSuccessResponse({
				race: {
					id: raceDoc.id,
					date: raceData?.date,
					status: raceData?.status || "ongoing",
					message: "レース結果はまだ確定していません",
				},
			});
		}

		// 参加者情報から結果を構築
		const participants = raceData.participants || [];

		// 在室時間順にソート（本来はattendanceから計算すべき）
		const sortedParticipants = [...participants].sort(
			(a: any, b: any) => (b.stayDuration || 0) - (a.stayDuration || 0)
		);

		const results = sortedParticipants.map((p: any, index: number) => ({
			rank: index + 1,
			userId: p.userId,
			displayName: p.displayName,
			stayDuration: p.stayDuration || 0,
		}));

		// 当選ベットの払い戻し情報を取得
		const betsQuery = await adminDb
			.collection("bets")
			.where("raceId", "==", raceId)
			.where("targetUserId", "==", raceData.winnerId)
			.get();

		const payouts = betsQuery.docs.map((doc) => {
			const betData = doc.data();
			const payout = Math.round(betData.points * (betData.oddsAtBet || 2.0));
			return {
				userId: betData.userId,
				betAmount: betData.points,
				payout,
				profit: payout - betData.points,
			};
		});

		return createSuccessResponse({
			race: {
				id: raceDoc.id,
				date: raceData.date,
				status: "finished",
				results,
				payouts,
			},
		});
	} catch (error) {
		console.error("レース結果取得エラー:", error);
		return serverError();
	}
}

