import { Timestamp } from "firebase/firestore";

/**
 * レースのステータス
 */
export type RaceStatus =
	| "upcoming" // 開催前（ベット受付中）
	| "ongoing" // 進行中
	| "completed" // 完了
	| "cancelled"; // キャンセル

/**
 * レース参加者（部員）
 */
export interface RaceParticipant {
	/** ユーザー ID */
	userId: string;

	/** 表示名 */
	displayName: string;

	/** プロフィール画像 URL */
	photoURL?: string;

	/** オッズ（倍率） */
	odds: number;

	/** このユーザーへの総ベット数 */
	totalBets: number;

	/** このユーザーへの総ベットポイント */
	totalBetPoints: number;
}

/**
 * レース情報
 */
export interface Race {
	/** レース ID */
	id: string;

	/** レース開催日 */
	date: string; // YYYY-MM-DD 形式

	/** レースのステータス */
	status: RaceStatus;

	/** レース開始予定時刻 */
	scheduledStartTime: Timestamp;

	/** レース実際の開始時刻 */
	actualStartTime?: Timestamp;

	/** レース終了時刻 */
	endTime?: Timestamp;

	/** 参加者リスト */
	participants: RaceParticipant[];

	/** 優勝者ユーザー ID */
	winnerId?: string;

	/** 2位のユーザー ID */
	secondPlaceId?: string;

	/** 3位のユーザー ID */
	thirdPlaceId?: string;

	/** 総ベット数 */
	totalBets: number;

	/** 総ベットポイント */
	totalBetPoints: number;

	/** 作成日時 */
	createdAt: Timestamp;

	/** 更新日時 */
	updatedAt: Timestamp;
}

/**
 * ベット情報
 */
export interface Bet {
	/** ベット ID */
	id: string;

	/** レース ID */
	raceId: string;

	/** ベットしたユーザー ID */
	userId: string;

	/** ベット対象の参加者ユーザー ID */
	targetUserId: string;

	/** ベットポイント数 */
	points: number;

	/** 予想オッズ（ベット時点） */
	oddsAtBet: number;

	/** 結果：勝利したか */
	isWin?: boolean;

	/** 払い戻しポイント */
	payoutPoints?: number;

	/** ベット日時 */
	createdAt: Timestamp;
}

/**
 * レース作成用の入力データ
 */
export interface CreateRaceInput {
	date: string;
	scheduledStartTime: Timestamp;
	participantUserIds: string[];
}

/**
 * ベット作成用の入力データ
 */
export interface CreateBetInput {
	raceId: string;
	targetUserId: string;
	points: number;
}

/**
 * レース結果
 */
export interface RaceResult {
	/** 優勝者 */
	winner: RaceParticipant;

	/** 2位 */
	secondPlace?: RaceParticipant;

	/** 3位 */
	thirdPlace?: RaceParticipant;

	/** 払い戻し総額 */
	totalPayout: number;

	/** 的中数 */
	winningBetsCount: number;
}



