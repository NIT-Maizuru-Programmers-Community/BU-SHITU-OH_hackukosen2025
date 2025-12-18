import { Timestamp } from "firebase/firestore";

/**
 * レースキャラクター（マスタデータ）
 */
export interface Character {
	/** キャラクターID */
	id: string;

	/** 表示名 */
	name: string;

	/** 絵文字 */
	emoji: string;

	/** 説明文 */
	description?: string;

	/** 表示順 */
	order: number;

	/** 有効/無効 */
	enabled: boolean;

	/** 作成日時 */
	createdAt?: Timestamp;
}

/**
 * レース参加キャラクター（レースごとのデータ）
 */
export interface RaceCharacter {
	/** キャラクターID */
	characterId: string;

	/** 表示名 */
	name: string;

	/** 絵文字 */
	emoji?: string;

	/** このキャラクターへの総ベット数 */
	totalBets: number;

	/** このキャラクターへの総ベットポイント */
	totalBetPoints: number;

	/** オッズ */
	odds?: number;

	/** 順位（完了後） */
	rank?: number;
}

/**
 * デフォルトのキャラクター定義
 */
export const DEFAULT_CHARACTERS: Character[] = [
	{
		id: "rabbit",
		name: "ウサギ",
		emoji: "🐰",
		description: "素早さが自慢",
		order: 1,
		enabled: true,
	},
	{
		id: "turtle",
		name: "カメ",
		emoji: "🐢",
		description: "着実に進む",
		order: 2,
		enabled: true,
	},
	{
		id: "cheetah",
		name: "チーター",
		emoji: "🐆",
		description: "最速のスピード",
		order: 3,
		enabled: true,
	},
	{
		id: "lion",
		name: "ライオン",
		emoji: "🦁",
		description: "百獣の王",
		order: 4,
		enabled: true,
	},
	{
		id: "wolf",
		name: "オオカミ",
		emoji: "🐺",
		description: "群れの力",
		order: 5,
		enabled: true,
	},
];

/**
 * キャラクターIDから情報を取得
 */
export function getCharacterById(characterId: string): Character | undefined {
	return DEFAULT_CHARACTERS.find((c) => c.id === characterId);
}

/**
 * 有効なキャラクターのみを取得
 */
export function getEnabledCharacters(): Character[] {
	return DEFAULT_CHARACTERS.filter((c) => c.enabled).sort(
		(a, b) => a.order - b.order
	);
}

