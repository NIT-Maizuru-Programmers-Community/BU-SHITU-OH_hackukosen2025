import { useState, useEffect } from "react";
import {
	collection,
	query,
	orderBy,
	limit,
	onSnapshot,
	DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface RankingUser {
	uid: string;
	displayName: string;
	points: number;
	rank: number;
	photoURL?: string;
}

export function useRanking(limitCount: number = 50) {
	const [ranking, setRanking] = useState<RankingUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		setLoading(true);

		const q = query(
			collection(db, "users"),
			orderBy("points", "desc"),
			limit(limitCount)
		);

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const rankingData: RankingUser[] = snapshot.docs.map((doc, index) => {
					const data = doc.data() as DocumentData;
					return {
						uid: doc.id,
						displayName: data.displayName || "名無し",
						points: data.points || 0,
						rank: index + 1,
						photoURL: data.photoURL,
					};
				});

				setRanking(rankingData);
				setLoading(false);
				setError(null);
			},
			(err) => {
				console.error("ランキング取得エラー:", err);
				setError(err as Error);
				setLoading(false);
			}
		);

		return () => unsubscribe();
	}, [limitCount]);

	return { ranking, loading, error };
}

// 自分の順位を取得する
export function useMyRank(myUid: string | undefined) {
	const { ranking } = useRanking();

	if (!myUid) return null;

	const myRanking = ranking.find((user) => user.uid === myUid);
	return myRanking?.rank || null;
}

