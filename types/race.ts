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
 * レース参加キャラクター
 */
export interface RaceCharacter {
	/** キャラクター ID */
	characterId: string;

	/** 表示名 */
	name: string;

	/** 絵文字 */
	emoji?: string;

	/** オッズ（倍率） */
	odds: number;

	/** このキャラクターへの総ベット数 */
	totalBets: number;

	/** このキャラクターへの総ベットポイント */
	totalBetPoints: number;

	/** 順位（完了後） */
	rank?: number;
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

	/** 参加キャラクターリスト */
	characters: RaceCharacter[];

	/** 優勝キャラクター ID */
	winnerCharacterId?: string;

	/** 2位のキャラクター ID */
	secondPlaceCharacterId?: string;

	/** 3位のキャラクター ID */
	thirdPlaceCharacterId?: string;

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

	/** ベット対象のキャラクター ID */
	targetCharacterId: string;

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
	characterIds: string[]; // レースに参加させるキャラクターID
}

/**
 * ベット作成用の入力データ
 */
export interface CreateBetInput {
	raceId: string;
	targetCharacterId: string;
	points: number;
}

/**
 * レース結果
 */
export interface RaceResult {
	/** 優勝キャラクター */
	winner: RaceCharacter;

	/** 2位 */
	secondPlace?: RaceCharacter;

	/** 3位 */
	thirdPlace?: RaceCharacter;

	/** 払い戻し総額 */
	totalPayout: number;

	/** 的中数 */
	winningBetsCount: number;
}
