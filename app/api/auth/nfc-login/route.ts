import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireHardwareAuth } from "@/lib/api/auth";
import { nfcLoginSchema } from "@/lib/api/validation";
import { awardPoints } from "@/lib/api/points";
import {
	badRequest,
	unauthorized,
	notFound,
	serverError,
	createSuccessResponse,
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
 * POST /api/auth/nfc-login
 * NFCカードをかざしてログイン（ログインボーナス付与）
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
		const validationResult = nfcLoginSchema.safeParse(body);

		if (!validationResult.success) {
			return badRequest("リクエストが不正です", {
				errors: validationResult.error.issues,
			});
		}

		const { nfcCardId } = validationResult.data;

		// NFCカードIDからユーザーを検索
		const userQuery = await adminDb
			.collection("users")
			.where("nfcCardId", "==", nfcCardId)
			.limit(1)
			.get();

		if (userQuery.empty) {
			return notFound("このカードは登録されていません");
		}

		const userDoc = userQuery.docs[0];
		const userId = userDoc.id;
		const userData = userDoc.data();

		// ログインボーナス判定
		const lastLoginAt = userData.lastLoginAt?.toDate() || null;
		const canReceiveBonus = canReceiveDailyBonus(lastLoginAt);

		let bonusResult = null;

		if (canReceiveBonus) {
			// ログインボーナス付与（100pt）
			const bonusPoints = 100;
			bonusResult = await awardPoints(
				userId,
				bonusPoints,
				"daily_bonus",
				"NFCログインボーナス"
			);
		}

		// 在室状態を更新
		const userRef = adminDb.collection("users").doc(userId);
		await userRef.update({
			isPresent: true,
			lastPresenceUpdate: FieldValue.serverTimestamp(),
			lastLoginAt: FieldValue.serverTimestamp(),
			hasReceivedDailyBonus: canReceiveBonus,
		});

		// 入室記録を作成
		await adminDb.collection("attendances").add({
			userId,
			displayName: userData.displayName || "不明なユーザー",
			type: "check_in",
			timestamp: FieldValue.serverTimestamp(),
			nfcId: nfcCardId,
		});

		// 更新後のユーザー情報を取得
		const updatedUserDoc = await userRef.get();
		const updatedUserData = updatedUserDoc.data();

		return createSuccessResponse({
			message: "ログインしました",
			user: {
				uid: userId,
				displayName: userData.displayName || "不明なユーザー",
				totalPoints: updatedUserData?.points || 0,
			},
			bonus: canReceiveBonus
				? {
						awarded: true,
						points: 100,
						message: "ログインボーナス +100pt",
				  }
				: {
						awarded: false,
						message: "本日のログインボーナスは受け取り済みです",
				  },
			checkIn: {
				status: "in",
				checkInTime: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("NFCログインエラー:", error);
		return serverError();
	}
}
