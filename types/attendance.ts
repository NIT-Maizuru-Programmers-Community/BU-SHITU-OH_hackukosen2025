import { Timestamp } from "firebase/firestore";

/**
 * 在室ログのタイプ
 */
export type AttendanceType =
	| "check_in" // 入室
	| "check_out" // 退室
	| "auto"; // 自動記録（定期チェックなど）

/**
 * 在室ログ
 */
export interface Attendance {
	/** ログ ID */
	id: string;

	/** ユーザー ID */
	userId: string;

	/** ユーザーの表示名 */
	displayName: string;

	/** 在室ログのタイプ */
	type: AttendanceType;

	/** 記録日時 */
	timestamp: Timestamp;

	/** 在室時間（分）- check_out の場合のみ */
	duration?: number;

	/** NFC カード ID */
	nfcId?: string;
}

/**
 * 在室記録作成用の入力データ
 */
export interface CreateAttendanceInput {
	userId: string;
	type: AttendanceType;
	nfcId?: string;
}

/**
 * 現在の在室者情報
 */
export interface CurrentAttendee {
	/** ユーザー ID */
	userId: string;

	/** 表示名 */
	displayName: string;

	/** プロフィール画像 URL */
	photoURL?: string;

	/** 入室時刻 */
	checkInTime: Timestamp;

	/** 在室時間（分） */
	durationMinutes: number;
}

/**
 * 在室統計
 */
export interface AttendanceStats {
	/** 総在室回数 */
	totalVisits: number;

	/** 総在室時間（分） */
	totalMinutes: number;

	/** 平均在室時間（分） */
	averageMinutes: number;

	/** 今月の在室回数 */
	thisMonthVisits: number;

	/** 今月の在室時間（分） */
	thisMonthMinutes: number;
}



