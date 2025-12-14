import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireUserAuth } from "@/lib/api/auth";
import { awardPoints } from "@/lib/api/points";
import {
	unauthorized,
	serverError,
	createSuccessResponse,
	createErrorResponse,
	ApiErrorCode,
} from "@/lib/api/errors";
import { FieldValue } from "firebase-admin/firestore";

/**
 * ログインボーナスを受け取れるかチェック
 */
function canReceiveDailyBonus(lastLoginAt: Date | null): boolean {
	if (!lastLoginAt) return true;

	const now = new Date();
	const lastLogin = new Date(lastLoginAt);

	// 同じ日付かチェック（日本時間基準）
	const today = new Date(
		now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
	);
	const lastLoginDay = new Date(
		lastLogin.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
	);

	return (
		today.getFullYear() !== lastLoginDay.getFullYear() ||
		today.getMonth() !== lastLoginDay.getMonth() ||
		today.getDate() !== lastLoginDay.getDate()
	);
}

/**
 * POST /api/auth/daily-bonus
 * ログインボーナスを手動で取得
 */
export async function POST(req: NextRequest) {
	try {
		// ユーザー認証チェック
		const auth = await requireUserAuth(req);
		if (!auth.authorized) {
			return unauthorized(auth.error);
		}

		const userId = auth.uid;

		// ユーザー情報を取得
		const userRef = adminDb.collection("users").doc(userId);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			return unauthorized("ユーザーが見つかりません");
		}

		const userData = userDoc.data();

		// ログインボーナス判定
		const lastLoginAt = userData?.lastLoginAt?.toDate() || null;
		const canReceiveBonus = canReceiveDailyBonus(lastLoginAt);

		if (!canReceiveBonus) {
			return createErrorResponse(
				"本日のログインボーナスは既に受け取り済みです",
				ApiErrorCode.DAILY_BONUS_CLAIMED,
				400
			);
		}

		// ログインボーナス付与（100pt）
		const bonusPoints = 100;
		const result = await awardPoints(
			userId,
			bonusPoints,
			"daily_bonus",
			"ログインボーナス"
		);

		// 最終ログイン日時とボーナス受取状態を更新
		await userRef.update({
			lastLoginAt: FieldValue.serverTimestamp(),
			hasReceivedDailyBonus: true,
		});

		return createSuccessResponse({
			points: bonusPoints,
			message: "ログインボーナスを獲得しました",
			totalPoints: result.newBalance,
		});
	} catch (error) {
		console.error("ログインボーナス取得エラー:", error);
		return serverError();
	}
}
