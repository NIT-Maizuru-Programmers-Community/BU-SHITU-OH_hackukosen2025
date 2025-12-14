import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { PointTransactionType } from "@/types/point";

/**
 * ポイント付与結果
 */
export interface AwardPointsResult {
	transactionId: string;
	userId: string;
	amount: number;
	type: string;
	newBalance: number;
	createdAt: Date;
}

/**
 * ポイント減算結果
 */
export interface DeductPointsResult {
	transactionId: string;
	userId: string;
	amount: number;
	type: string;
	newBalance: number;
	createdAt: Date;
}

/**
 * ポイントを付与する（トランザクション処理）
 */
export async function awardPoints(
	userId: string,
	amount: number,
	type: PointTransactionType,
	description: string,
	relatedId?: string
): Promise<AwardPointsResult> {
	const userRef = adminDb.collection("users").doc(userId);
	const transactionRef = adminDb.collection("pointTransactions").doc();

	let newBalance = 0;
	const createdAt = new Date();

	await adminDb.runTransaction(async (transaction) => {
		const userDoc = await transaction.get(userRef);

		if (!userDoc.exists) {
			throw new Error("ユーザーが見つかりません");
		}

		const currentPoints = userDoc.data()?.points || 0;
		newBalance = currentPoints + amount;

		// ユーザーのポイント更新
		transaction.update(userRef, {
			points: newBalance,
			updatedAt: FieldValue.serverTimestamp(),
		});

		// トランザクション履歴の記録
		transaction.set(transactionRef, {
			userId,
			type,
			amount,
			balanceAfter: newBalance,
			description,
			referenceId: relatedId || null,
			createdAt: FieldValue.serverTimestamp(),
		});
	});

	return {
		transactionId: transactionRef.id,
		userId,
		amount,
		type,
		newBalance,
		createdAt,
	};
}

/**
 * ポイントを減算する（トランザクション処理）
 */
export async function deductPoints(
	userId: string,
	amount: number,
	type: PointTransactionType,
	description: string,
	relatedId?: string
): Promise<DeductPointsResult> {
	const userRef = adminDb.collection("users").doc(userId);
	const transactionRef = adminDb.collection("pointTransactions").doc();

	let newBalance = 0;
	const createdAt = new Date();

	await adminDb.runTransaction(async (transaction) => {
		const userDoc = await transaction.get(userRef);

		if (!userDoc.exists) {
			throw new Error("ユーザーが見つかりません");
		}

		const currentPoints = userDoc.data()?.points || 0;

		// ポイント不足チェック
		if (currentPoints < amount) {
			throw new Error("INSUFFICIENT_POINTS");
		}

		newBalance = currentPoints - amount;

		// ユーザーのポイント更新
		transaction.update(userRef, {
			points: newBalance,
			updatedAt: FieldValue.serverTimestamp(),
		});

		// トランザクション履歴の記録（負の値で記録）
		transaction.set(transactionRef, {
			userId,
			type,
			amount: -amount,
			balanceAfter: newBalance,
			description,
			referenceId: relatedId || null,
			createdAt: FieldValue.serverTimestamp(),
		});
	});

	return {
		transactionId: transactionRef.id,
		userId,
		amount: -amount,
		type,
		newBalance,
		createdAt,
	};
}

/**
 * ユーザーのポイント残高を取得
 */
export async function getUserBalance(userId: string): Promise<{
	userId: string;
	displayName: string;
	totalPoints: number;
	updatedAt: Date | null;
}> {
	const userDoc = await adminDb.collection("users").doc(userId).get();

	if (!userDoc.exists) {
		throw new Error("ユーザーが見つかりません");
	}

	const userData = userDoc.data();

	return {
		userId,
		displayName: userData?.displayName || "不明なユーザー",
		totalPoints: userData?.points || 0,
		updatedAt: userData?.updatedAt?.toDate() || null,
	};
}

