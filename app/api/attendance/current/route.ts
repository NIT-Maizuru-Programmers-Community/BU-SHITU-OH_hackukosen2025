import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { serverError, createSuccessResponse } from "@/lib/api/errors";

/**
 * 在室時間を計算（分単位）
 */
function calculateDuration(checkInTime: Date): number {
	const now = new Date();
	const durationMs = now.getTime() - checkInTime.getTime();
	return Math.floor(durationMs / (1000 * 60)); // 分に変換
}

/**
 * GET /api/attendance/current
 * 現在在室中のメンバー一覧を取得
 */
export async function GET(req: NextRequest) {
	try {
		// 在室中のユーザーを取得
		const presentUsersQuery = await adminDb
			.collection("users")
			.where("isPresent", "==", true)
			.get();

		const members = await Promise.all(
			presentUsersQuery.docs.map(async (doc) => {
				const userData = doc.data();

				// 最後のチェックイン時刻を取得
				const lastCheckInQuery = await adminDb
					.collection("attendances")
					.where("userId", "==", doc.id)
					.where("type", "==", "check_in")
					.orderBy("timestamp", "desc")
					.limit(1)
					.get();

				let checkInTime = new Date();
				if (!lastCheckInQuery.empty) {
					const lastCheckInData = lastCheckInQuery.docs[0].data();
					checkInTime = lastCheckInData.timestamp?.toDate() || new Date();
				}

				const duration = calculateDuration(checkInTime);

				return {
					userId: doc.id,
					displayName: userData.displayName || "不明なユーザー",
					photoURL: userData.photoURL || null,
					checkInTime: checkInTime.toISOString(),
					duration,
				};
			})
		);

		return createSuccessResponse({
			members,
			total: members.length,
		});
	} catch (error) {
		console.error("在室者一覧取得エラー:", error);
		return serverError();
	}
}

