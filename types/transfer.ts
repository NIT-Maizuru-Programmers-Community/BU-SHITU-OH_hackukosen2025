import { Timestamp } from "firebase/firestore";

/**
 * ポイント送金（スパチャ）
 */
export interface Transfer {
	/** 送金 ID */
	id: string;

	/** 送信者ユーザー ID */
	senderId: string;

	/** 送信者の表示名 */
	senderDisplayName: string;

	/** 受信者ユーザー ID */
	receiverId: string;

	/** 受信者の表示名 */
	receiverDisplayName: string;

	/** 送金ポイント数 */
	points: number;

	/** メッセージ */
	message?: string;

	/** 送金日時 */
	createdAt: Timestamp;
}

/**
 * 送金作成用の入力データ
 */
export interface CreateTransferInput {
	receiverId: string;
	points: number;
	message?: string;
}



