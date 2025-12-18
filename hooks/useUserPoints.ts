import { useState, useEffect } from "react";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useUserPoints(userId: string | undefined) {
	const [points, setPoints] = useState<number>(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!userId) {
			setPoints(0);
			setLoading(false);
			return;
		}

		setLoading(true);

		const userRef = doc(db, "users", userId);

		const unsubscribe = onSnapshot(
			userRef,
			(docSnap) => {
				if (docSnap.exists()) {
					const data = docSnap.data() as DocumentData;
					setPoints(data.points || 0);
				} else {
					setPoints(0);
				}
				setLoading(false);
				setError(null);
			},
			(err) => {
				console.error("ポイント取得エラー:", err);
				setError(err as Error);
				setLoading(false);
			}
		);

		return () => unsubscribe();
	}, [userId]);

	return { points, loading, error };
}

