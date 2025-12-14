import { z } from "zod";

/**
 * NFC カード登録のバリデーションスキーマ
 */
export const registerNfcSchema = z.object({
	nfcCardId: z.string().min(1, "NFCカードIDは必須です"),
	userId: z.string().min(1, "ユーザーIDは必須です"),
});

/**
 * NFC ログインのバリデーションスキーマ
 */
export const nfcLoginSchema = z.object({
	nfcCardId: z.string().min(1, "NFCカードIDは必須です"),
});

/**
 * ポイント付与のバリデーションスキーマ
 */
export const awardPointsSchema = z.object({
	userId: z.string().min(1, "ユーザーIDは必須です"),
	amount: z
		.number()
		.int()
		.positive()
		.max(10000, "ポイントは10000以下である必要があります"),
	type: z.enum([
		"daily_bonus",
		"attendance",
		"race_win",
		"transfer_received",
		"admin_adjustment",
		"reset",
	]),
	description: z.string().max(200, "説明は200文字以内である必要があります"),
	relatedId: z.string().optional(),
});

/**
 * ポイント減算のバリデーションスキーマ
 */
export const deductPointsSchema = z.object({
	userId: z.string().min(1, "ユーザーIDは必須です"),
	amount: z
		.number()
		.int()
		.positive()
		.max(10000, "ポイントは10000以下である必要があります"),
	type: z.enum(["race_bet", "transfer_sent", "admin_adjustment"]),
	description: z.string().max(200, "説明は200文字以内である必要があります"),
	relatedId: z.string().optional(),
});

/**
 * レースベットのバリデーションスキーマ
 */
export const raceBetSchema = z.object({
	userId: z.string().min(1, "ユーザーIDは必須です"),
	raceId: z.string().min(1, "レースIDは必須です"),
	targetUserId: z.string().min(1, "対象ユーザーIDは必須です"),
	amount: z
		.number()
		.int()
		.positive()
		.max(10000, "ベット額は10000以下である必要があります"),
});

/**
 * レース予想のバリデーションスキーマ
 */
export const racePredictSchema = z.object({
	userId: z.string().min(1, "ユーザーIDは必須です"),
	raceId: z.string().min(1, "レースIDは必須です"),
	predictedUserId: z.string().min(1, "予想ユーザーIDは必須です"),
});

/**
 * 送金のバリデーションスキーマ
 */
export const transferSchema = z.object({
	receiverId: z.string().min(1, "受信者IDは必須です"),
	amount: z
		.number()
		.int()
		.positive()
		.max(10000, "送金額は10000以下である必要があります"),
	message: z
		.string()
		.max(200, "メッセージは200文字以内である必要があります")
		.optional(),
});

/**
 * チェックインのバリデーションスキーマ
 */
export const checkInSchema = z.object({
	userId: z.string().min(1, "ユーザーIDは必須です"),
});

/**
 * チェックアウトのバリデーションスキーマ
 */
export const checkOutSchema = z.object({
	userId: z.string().min(1, "ユーザーIDは必須です"),
});
