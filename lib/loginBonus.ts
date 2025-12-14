import {
	doc,
	getDoc,
	updateDoc,
	addDoc,
	collection,
	Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const DAILY_BONUS_POINTS = 10;

/**
 * ログインボーナスを付与する
 * NOTE: この関数は部室の端末（NFCリーダー）で使用されます。
 * アプリ側からは直接呼び出さないでください。
 * @param userId ユーザーID
 * @returns ボーナスを受け取ったかどうか
 */
export async function checkAndGrantDailyBonus(
	userId: string
): Promise<boolean> {
	try {
		const userRef = doc(db, "users", userId);
		const userDoc = await getDoc(userRef);

		if (!userDoc.exists()) {
			return false;
		}

		const userData = userDoc.data();
		const now = new Date();
		const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

		const lastLoginAt = userData.lastLoginAt?.toDate();
		const lastLoginDate = lastLoginAt
			? lastLoginAt.toISOString().split("T")[0]
			: null;

		// 今日既にログインボーナスを受け取っているかチェック
		if (lastLoginDate === today && userData.hasReceivedDailyBonus) {
			return false;
		}

		// ポイントを付与
		const newPoints = (userData.points || 0) + DAILY_BONUS_POINTS;

		// ユーザー情報を更新
		await updateDoc(userRef, {
			points: newPoints,
			lastLoginAt: Timestamp.now(),
			hasReceivedDailyBonus: true,
			updatedAt: Timestamp.now(),
		});

		// ポイント履歴を記録
		await addDoc(collection(db, "points"), {
			userId,
			type: "daily_bonus",
			amount: DAILY_BONUS_POINTS,
			balanceAfter: newPoints,
			description: "ログインボーナス",
			createdAt: Timestamp.now(),
		});

		return true;
	} catch (error) {
		console.error("ログインボーナス付与エラー:", error);
		return false;
	}
}

/**
 * 日付が変わったかチェックし、必要に応じてボーナスフラグをリセット
 * NOTE: この関数は部室の端末（NFCリーダー）で使用されます。
 * @param userId ユーザーID
 */
export async function resetDailyBonusIfNeeded(userId: string): Promise<void> {
	try {
		const userRef = doc(db, "users", userId);
		const userDoc = await getDoc(userRef);

		if (!userDoc.exists()) {
			return;
		}

		const userData = userDoc.data();
		const now = new Date();
		const today = now.toISOString().split("T")[0];

		const lastLoginAt = userData.lastLoginAt?.toDate();
		const lastLoginDate = lastLoginAt
			? lastLoginAt.toISOString().split("T")[0]
			: null;

		// 日付が変わっていて、ボーナスフラグが立っている場合はリセット
		if (lastLoginDate !== today && userData.hasReceivedDailyBonus) {
			await updateDoc(userRef, {
				hasReceivedDailyBonus: false,
			});
		}
	} catch (error) {
		console.error("ログインボーナスフラグリセットエラー:", error);
	}
}
