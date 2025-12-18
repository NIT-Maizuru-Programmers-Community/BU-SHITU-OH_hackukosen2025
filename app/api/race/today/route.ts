import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { serverError, createSuccessResponse } from "@/lib/api/errors";

/**
 * 今日の日付を取得（YYYY-MM-DD形式、日本時間）
 */
function getTodayDateString(): string {
	const now = new Date();
	const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
	return jst.toISOString().split("T")[0];
}

/**
 * GET /api/race/today
 * 本日のレース情報を取得
 */
export async function GET(req: NextRequest) {
	try {
		const today = getTodayDateString();

		// 今日のレースを検索
		const raceQuery = await adminDb
			.collection("races")
			.where("date", "==", today)
			.limit(1)
			.get();

		if (raceQuery.empty) {
			// レースが存在しない場合
			return createSuccessResponse({
				race: null,
				message: "本日のレースはまだ作成されていません",
			});
		}

		const raceDoc = raceQuery.docs[0];
		const raceData = raceDoc.data();

		// 参加者情報を構築
		const participants = (raceData.participants || []).map((p: any) => ({
			userId: p.userId,
			displayName: p.displayName,
			totalBets: p.totalBets || 0,
		}));

		// レースステータスを判定
		let status = raceData.status || "open";
		if (raceData.winnerId) {
			status = "finished";
		}

		return createSuccessResponse({
			race: {
				id: raceDoc.id,
				date: raceData.date,
				status,
				participants,
				startTime: raceData.scheduledStartTime?.toDate().toISOString() || null,
				endTime: raceData.endTime?.toDate().toISOString() || null,
				totalPool: raceData.totalBetPoints || 0,
			},
		});
	} catch (error) {
		console.error("本日のレース取得エラー:", error);
		return serverError();
	}
}


