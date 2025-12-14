import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireUserAuth } from "@/lib/api/auth";
import {
	badRequest,
	unauthorized,
	serverError,
	createSuccessResponse,
} from "@/lib/api/errors";

/**
 * GET /api/attendance/history?userId=user_uid&limit=30
 * 特定ユーザーの出席履歴を取得
 */
export async function GET(req: NextRequest) {
	try {
		// ユーザー認証チェック
		const auth = await requireUserAuth(req);
		if (!auth.authorized) {
			return unauthorized(auth.error);
		}

		// クエリパラメータを取得
		const { searchParams } = new URL(req.url);
		const userId = searchParams.get("userId");
		const limitStr = searchParams.get("limit") || "30";

		if (!userId) {
			return badRequest("userIdは必須です");
		}

		// 権限チェック（自分の履歴のみ閲覧可能）
		if (auth.uid !== userId) {
			return unauthorized("他のユーザーの履歴は閲覧できません");
		}

		const limit = Math.min(parseInt(limitStr, 10), 100);

		// チェックアウト記録を取得（退室時に在室時間が記録される）
		const attendanceQuery = await adminDb
			.collection("attendances")
			.where("userId", "==", userId)
			.where("type", "==", "check_out")
			.orderBy("timestamp", "desc")
			.limit(limit)
			.get();

		const history = await Promise.all(
			attendanceQuery.docs.map(async (doc) => {
				const data = doc.data();
				const checkOutTime = data.timestamp?.toDate() || new Date();
				const duration = data.duration || 0;

				// 対応するチェックイン時刻を計算（checkOutTime - duration）
				const checkInTime = new Date(
					checkOutTime.getTime() - duration * 60 * 1000
				);

				return {
					id: doc.id,
					userId,
					checkInTime: checkInTime.toISOString(),
					checkOutTime: checkOutTime.toISOString(),
					duration,
				};
			})
		);

		return createSuccessResponse({
			history,
			total: history.length,
		});
	} catch (error) {
		console.error("出席履歴取得エラー:", error);
		return serverError();
	}
}

