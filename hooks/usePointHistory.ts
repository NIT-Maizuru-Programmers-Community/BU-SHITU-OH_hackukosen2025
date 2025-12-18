import { useState, useEffect } from "react";
import {
	collection,
	query,
	where,
	orderBy,
	limit,
	onSnapshot,
	DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PointHistoryType =
	| "daily_bonus"
	| "attendance"
	| "race_win"
	| "race_bet"
	| "transfer_sent"
	| "transfer_received"
	| "award"
	| "deduct"
	| "reset";

export interface PointHistoryItem {
	id: string;
	userId: string;
	amount: number; // 正: 獲得, 負: 使用
	type: PointHistoryType;
	description: string;
	relatedId?: string;
	message?: string; // 送金時のメッセージ
	createdAt: Date;
}

export function usePointHistory(
	userId: string | undefined,
	limitCount: number = 50
) {
	const [history, setHistory] = useState<PointHistoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!userId) {
			setHistory([]);
			setLoading(false);
			return;
		}

		setLoading(true);

		const q = query(
			collection(db, "pointTransactions"),
			where("userId", "==", userId),
			orderBy("createdAt", "desc"),
			limit(limitCount)
		);

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const historyData: PointHistoryItem[] = snapshot.docs.map((doc) => {
					const data = doc.data() as DocumentData;
					return {
						id: doc.id,
						userId: data.userId,
						amount: data.amount || 0,
						type: data.type || "award",
						description: data.description || "",
						relatedId: data.relatedId,
						message: data.message,
						createdAt: data.createdAt?.toDate() || new Date(),
					};
				});

				setHistory(historyData);
				setLoading(false);
				setError(null);
			},
			(err) => {
				console.error("ポイント履歴取得エラー:", err);
				setError(err as Error);
				setLoading(false);
			}
		);

		return () => unsubscribe();
	}, [userId, limitCount]);

	return { history, loading, error };
}

// 履歴をフィルター
export function useFilteredPointHistory(
	userId: string | undefined,
	filter: "all" | "earned" | "spent" = "all"
) {
	const { history, loading, error } = usePointHistory(userId);

	const filteredHistory = history.filter((item) => {
		if (filter === "earned") return item.amount > 0;
		if (filter === "spent") return item.amount < 0;
		return true;
	});

	return { history: filteredHistory, loading, error };
}
