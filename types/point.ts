import { Timestamp } from "firebase/firestore";

/**
 * ポイント取得/消費の種類
 */
export type PointTransactionType =
	| "daily_bonus" // ログインボーナス
	| "attendance" // 在室ポイント
	| "race_win" // レース勝利
	| "race_bet" // レースベット
	| "transfer_sent" // 送金（送信）
	| "transfer_received" // 送金（受信）
	| "admin_adjustment" // 管理者による調整
	| "reset"; // ポイントリセット

/**
 * ポイント履歴
 */
export interface PointTransaction {
	/** トランザクション ID */
	id: string;

	/** ユーザー ID */
	userId: string;

	/** トランザクションタイプ */
	type: PointTransactionType;

	/** ポイント変動量（正の値：獲得、負の値：消費） */
	amount: number;

	/** トランザクション後の合計ポイント */
	balanceAfter: number;

	/** 説明・メモ */
	description?: string;

	/** 関連する参照 ID（レース ID、送金 ID など） */
	referenceId?: string;

	/** メッセージ（送金時など） */
	message?: string;

	/** 作成日時 */
	createdAt: Timestamp;
}

/**
 * ポイント履歴作成用の入力データ
 */
export interface CreatePointTransactionInput {
	userId: string;
	type: PointTransactionType;
	amount: number;
	description?: string;
	referenceId?: string;
}

/**
 * ポイント統計情報
 */
export interface PointStats {
	/** 総獲得ポイント */
	totalEarned: number;

	/** 総消費ポイント */
	totalSpent: number;

	/** 現在のポイント */
	currentBalance: number;

	/** ログインボーナスで獲得したポイント */
	fromDailyBonus: number;

	/** 在室で獲得したポイント */
	fromAttendance: number;

	/** レースで獲得したポイント */
	fromRaces: number;

	/** 送金で受け取ったポイント */
	fromTransfers: number;
}




