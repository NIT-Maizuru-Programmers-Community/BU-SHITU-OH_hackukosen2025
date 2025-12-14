import { useState, useEffect } from "react";
import {
	collection,
	query,
	where,
	orderBy,
	limit,
	onSnapshot,
	DocumentData,
	Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface RaceParticipant {
	userId: string;
	displayName: string;
	totalBets: number;
	odds: number;
	rank?: number;
	stayDuration?: number;
}

export interface Race {
	id: string;
	date: string;
	status: "open" | "closed" | "finished";
	participants: RaceParticipant[];
	startTime: Date;
	endTime: Date;
}

export function useTodayRace() {
	const [race, setRace] = useState<Race | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		setLoading(true);

		// 今日の日付を取得
		const today = new Date().toISOString().split("T")[0];

		const q = query(
			collection(db, "races"),
			where("date", "==", today),
			limit(1)
		);

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				if (snapshot.empty) {
					setRace(null);
					setLoading(false);
					return;
				}

				const doc = snapshot.docs[0];
				const data = doc.data() as DocumentData;

				const raceData: Race = {
					id: doc.id,
					date: data.date,
					status: data.status || "open",
					participants: data.participants || [],
					startTime: data.startTime?.toDate() || new Date(),
					endTime: data.endTime?.toDate() || new Date(),
				};

				setRace(raceData);
				setLoading(false);
				setError(null);
			},
			(err) => {
				console.error("レース取得エラー:", err);
				setError(err as Error);
				setLoading(false);
			}
		);

		return () => unsubscribe();
	}, []);

	return { race, loading, error };
}

// 過去のレース履歴を取得
export function useRaceHistory(limitCount: number = 10) {
	const [races, setRaces] = useState<Race[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		setLoading(true);

		const q = query(
			collection(db, "races"),
			where("status", "==", "finished"),
			orderBy("date", "desc"),
			limit(limitCount)
		);

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const raceData: Race[] = snapshot.docs.map((doc) => {
					const data = doc.data() as DocumentData;
					return {
						id: doc.id,
						date: data.date,
						status: data.status,
						participants: data.participants || [],
						startTime: data.startTime?.toDate() || new Date(),
						endTime: data.endTime?.toDate() || new Date(),
					};
				});

				setRaces(raceData);
				setLoading(false);
				setError(null);
			},
			(err) => {
				console.error("レース履歴取得エラー:", err);
				setError(err as Error);
				setLoading(false);
			}
		);

		return () => unsubscribe();
	}, [limitCount]);

	return { races, loading, error };
}
