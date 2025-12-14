import { Timestamp } from "firebase/firestore";

/**
 * ユーザー情報
 */
export interface User {
	/** ユーザー ID (Firebase Auth UID) */
	id: string;

	/** 表示名 */
	displayName: string;

	/** メールアドレス */
	email?: string;

	/** プロフィール画像 URL */
	photoURL?: string;

	/** 現在のポイント数 */
	points: number;

	/** NFC カード ID（登録済みの場合） */
	nfcId?: string;

	/** 最終ログイン日時 */
	lastLoginAt: Timestamp;

	/** 登録日時 */
	createdAt: Timestamp;

	/** 更新日時 */
	updatedAt: Timestamp;

	/** 今日ログインボーナスを受け取ったか */
	hasReceivedDailyBonus: boolean;

	/** 現在在室中かどうか */
	isPresent: boolean;

	/** 最後に在室記録が更新された日時 */
	lastPresenceUpdate?: Timestamp;
}

/**
 * ユーザー作成用の入力データ
 */
export interface CreateUserInput {
	displayName: string;
	email?: string;
	photoURL?: string;
}

/**
 * ユーザー更新用の入力データ
 */
export interface UpdateUserInput {
	displayName?: string;
	photoURL?: string;
	nfcId?: string;
}



