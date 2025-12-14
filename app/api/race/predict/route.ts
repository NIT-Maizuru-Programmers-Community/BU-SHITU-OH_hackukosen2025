import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api/auth";
import { racePredictSchema } from "@/lib/api/validation";
import {
	badRequest,
	unauthorized,
	notFound,
	serverError,
	createSuccessResponse,
} from "@/lib/api/errors";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/race/predict
 * レース予想を記録（ログインボーナスに影響）
 */
export async function POST(req: NextRequest) {
	try {
		// 認証チェック
		const auth = await verifyAuth(req);
		if (!auth.authorized) {
			return unauthorized(auth.error);
		}

		// リクエストボディの取得とバリデーション
		const body = await req.json();
		const validationResult = racePredictSchema.safeParse(body);

		if (!validationResult.success) {
			return badRequest("リクエストが不正です", {
				errors: validationResult.error.errors,
			});
		}

		const { userId, raceId, predictedUserId } = validationResult.data;

		// 権限チェック（ユーザー認証の場合、自分の予想のみ記録可能）
		if (auth.type === "user" && auth.uid !== userId) {
			return unauthorized("他のユーザーの予想は記録できません");
		}

		// レースの存在確認
		const raceDoc = await adminDb.collection("races").doc(raceId).get();

		if (!raceDoc.exists) {
			return notFound("レースが見つかりません");
		}

		const raceData = raceDoc.data();

		// 対象ユーザーが参加者に含まれているかチェック
		const participants = raceData?.participants || [];
		const targetParticipant = participants.find(
			(p: any) => p.userId === predictedUserId
		);

		if (!targetParticipant) {
			return badRequest("指定されたユーザーはレースに参加していません");
		}

		// 既存の予想を確認
		const existingPredictionQuery = await adminDb
			.collection("predictions")
			.where("userId", "==", userId)
			.where("raceId", "==", raceId)
			.limit(1)
			.get();

		let predictionId: string;

		if (!existingPredictionQuery.empty) {
			// 既存の予想を更新
			const existingDoc = existingPredictionQuery.docs[0];
			predictionId = existingDoc.id;
			await adminDb.collection("predictions").doc(predictionId).update({
				predictedUserId,
				updatedAt: FieldValue.serverTimestamp(),
			});
		} else {
			// 新規予想を作成
			const predictionRef = await adminDb.collection("predictions").add({
				userId,
				raceId,
				predictedUserId,
				createdAt: FieldValue.serverTimestamp(),
			});
			predictionId = predictionRef.id;
		}

		return createSuccessResponse({
			message: "予想を記録しました",
			prediction: {
				id: predictionId,
				userId,
				raceId,
				predictedUserId,
				createdAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("レース予想記録エラー:", error);
		return serverError();
	}
}

