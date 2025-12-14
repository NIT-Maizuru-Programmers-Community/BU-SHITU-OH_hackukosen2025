import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

// 環境変数を読み込む
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Firebase Admin の初期化
if (getApps().length === 0) {
	const serviceAccount = JSON.parse(
		process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
	);

	initializeApp({
		credential: cert(serviceAccount),
	});
}

const db = getFirestore();

// ユーザーIDのサンプル（実際のusersコレクションから取得したIDに置き換えてください）
const USER_IDS = [
	"user1",
	"user2",
	"user3",
	"user4",
	"user5",
	"user6",
	"user7",
	"user8",
];

const USER_NAMES = [
	"田中太郎",
	"佐藤花子",
	"鈴木一郎",
	"高橋美咲",
	"伊藤健太",
	"渡辺由美",
	"山本翔太",
	"中村愛",
];

// 日付をYYYY-MM-DD形式で取得
function getDateString(daysAgo: number = 0): string {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	return date.toISOString().split("T")[0];
}

// Timestampを生成
function getTimestamp(daysAgo: number = 0, hoursOffset: number = 0): Timestamp {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	date.setHours(date.getHours() + hoursOffset);
	return Timestamp.fromDate(date);
}

// ランダムな整数を生成
function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ランダムな要素を選択
function randomChoice<T>(array: T[]): T {
	return array[randomInt(0, array.length - 1)];
}

async function seedAttendance() {
	console.log("📍 在室状況データを作成中...");

	if (USER_IDS.length === 0) {
		console.log("⚠️  ユーザーが存在しないため、在室状況データをスキップします");
		return;
	}

	const batch = db.batch();

	// 現在在室中のユーザー（実際のユーザー数と3-5人の少ない方）
	const maxAttendees = Math.min(USER_IDS.length, randomInt(3, 5));

	for (let i = 0; i < maxAttendees; i++) {
		const userId = USER_IDS[i];

		// userIdが有効かチェック
		if (!userId || userId.trim() === "") {
			console.log(`⚠️  スキップ: 無効なユーザーID at index ${i}`);
			continue;
		}

		const checkInTime = getTimestamp(0, -randomInt(1, 8)); // 1-8時間前に入室

		const docRef = db.collection("attendance").doc(userId);
		batch.set(docRef, {
			userId: userId,
			displayName: USER_NAMES[i],
			status: "in",
			checkInTime: checkInTime,
			checkOutTime: null,
			updatedAt: Timestamp.now(),
		});
	}

	await batch.commit();
	console.log(`✅ 在室状況データ作成完了: ${maxAttendees}人`);
}

async function seedRaces() {
	console.log("🏁 レースデータを作成中...");

	if (USER_IDS.length === 0) {
		console.log("⚠️  ユーザーが存在しないため、レースデータをスキップします");
		return;
	}

	const batch = db.batch();

	// 今日のレース
	const todayDate = getDateString(0);
	const todayRaceRef = db.collection("races").doc();
	const participantCount = Math.min(USER_IDS.length, 6);
	const todayParticipants = USER_IDS.slice(0, participantCount).map(
		(userId, index) => ({
			userId: userId,
			displayName: USER_NAMES[index],
			totalBets: randomInt(10, 200),
			odds: parseFloat((1.5 + Math.random() * 2).toFixed(2)),
		})
	);

	batch.set(todayRaceRef, {
		date: todayDate,
		status: "open",
		participants: todayParticipants,
		startTime: getTimestamp(0, -8), // 8時間前開始
		endTime: getTimestamp(0, 10), // 10時間後終了
		createdAt: Timestamp.now(),
	});

	// 過去のレース（5日分）
	for (let i = 1; i <= 5; i++) {
		const raceDate = getDateString(i);
		const raceRef = db.collection("races").doc();
		const maxParticipants = Math.min(USER_IDS.length, randomInt(4, 8));
		const participants = USER_IDS.slice(0, maxParticipants).map(
			(userId, index) => {
				const stayDuration = randomInt(60, 480); // 60-480分
				return {
					userId: userId,
					displayName: USER_NAMES[index],
					totalBets: randomInt(50, 300),
					odds: parseFloat((1.5 + Math.random() * 2).toFixed(2)),
					rank: index + 1,
					stayDuration: stayDuration,
				};
			}
		);

		// ランクでソート
		participants.sort((a, b) => (b.stayDuration || 0) - (a.stayDuration || 0));
		participants.forEach((p, idx) => {
			p.rank = idx + 1;
		});

		batch.set(raceRef, {
			date: raceDate,
			status: "finished",
			participants: participants,
			startTime: getTimestamp(i, -12),
			endTime: getTimestamp(i, 6),
			createdAt: getTimestamp(i, -12),
		});
	}

	await batch.commit();
	console.log("✅ レースデータ作成完了: 今日のレース + 過去5日分");
}

async function seedBets() {
	console.log("💰 ベットデータを作成中...");

	// まず、レースを取得
	const racesSnapshot = await db.collection("races").get();
	const races = racesSnapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data(),
	}));

	let betCount = 0;
	const batchSize = 500;
	let batch = db.batch();
	let batchCount = 0;

	for (const race of races) {
		const raceId = race.id;
		const participants = race.participants || [];

		// 各参加者がランダムに他の参加者にベット
		for (let i = 0; i < participants.length; i++) {
			const bettor = participants[i];
			const numBets = randomInt(0, 2); // 0-2回ベット

			for (let j = 0; j < numBets; j++) {
				// 自分以外にベット
				const targets = participants.filter(
					(p: any) => p.userId !== bettor.userId
				);
				if (targets.length === 0) continue;

				const target = randomChoice(targets);
				const amount = randomInt(10, 100);

				const betRef = db.collection("bets").doc();
				const betData: any = {
					raceId: raceId,
					bettorId: bettor.userId,
					targetUserId: target.userId,
					amount: amount,
					createdAt:
						race.status === "finished"
							? getTimestamp(
									parseInt(race.date.split("-")[2]) -
										parseInt(getDateString(0).split("-")[2]),
									-10
							  )
							: Timestamp.now(),
				};

				// 終了したレースの場合、結果とペイアウトを追加
				if (race.status === "finished") {
					const targetRank = target.rank || 999;
					if (targetRank === 1) {
						betData.result = "win";
						betData.payout = Math.floor(amount * 2.0);
					} else if (targetRank === 2) {
						betData.result = "win";
						betData.payout = Math.floor(amount * 1.5);
					} else if (targetRank === 3) {
						betData.result = "win";
						betData.payout = Math.floor(amount * 1.2);
					} else {
						betData.result = "lose";
						betData.payout = 0;
					}
				}

				batch.set(betRef, betData);
				batchCount++;
				betCount++;

				// バッチサイズに達したらコミット
				if (batchCount >= batchSize) {
					await batch.commit();
					batch = db.batch();
					batchCount = 0;
				}
			}
		}
	}

	// 残りのバッチをコミット
	if (batchCount > 0) {
		await batch.commit();
	}

	console.log(`✅ ベットデータ作成完了: ${betCount}件`);
}

async function seedTransfers() {
	console.log("💸 ポイント送金データを作成中...");

	if (USER_IDS.length < 2) {
		console.log("⚠️  ユーザーが2人未満のため、送金データをスキップします");
		return;
	}

	const batch = db.batch();

	const messages = [
		"ありがとうございます！",
		"先日はお世話になりました",
		"プログラミング教えてくれてありがとう！",
		"レース頑張ってください！",
		"応援してます",
		"お疲れ様です",
		"いつもありがとう",
		"また教えてください",
		"",
		"",
	]; // 空文字はメッセージなし

	// 過去7日間でランダムに送金履歴を作成
	for (let i = 0; i < 20; i++) {
		const senderId = randomChoice(USER_IDS);
		let receiverId = randomChoice(USER_IDS);

		// 送信者と受信者が同じにならないようにする
		while (receiverId === senderId) {
			receiverId = randomChoice(USER_IDS);
		}

		const senderIndex = USER_IDS.indexOf(senderId);
		const receiverIndex = USER_IDS.indexOf(receiverId);
		const amount = randomInt(5, 100);
		const message = randomChoice(messages);

		const transferRef = db.collection("transfers").doc();
		const transferData: any = {
			senderId: senderId,
			senderName: USER_NAMES[senderIndex],
			receiverId: receiverId,
			receiverName: USER_NAMES[receiverIndex],
			amount: amount,
			createdAt: getTimestamp(randomInt(0, 7), -randomInt(0, 23)),
		};

		if (message) {
			transferData.message = message;
		}

		batch.set(transferRef, transferData);
	}

	await batch.commit();
	console.log("✅ ポイント送金データ作成完了: 20件");
}

async function main() {
	console.log("🌱 モックデータの作成を開始します...\n");

	try {
		// 既存のusersコレクションからユーザーIDを取得
		console.log("📋 既存のユーザー情報を取得中...");
		const usersSnapshot = await db.collection("users").limit(10).get();

		if (!usersSnapshot.empty) {
			// 実際のユーザーIDを使用
			USER_IDS.length = 0;
			USER_NAMES.length = 0;

			usersSnapshot.docs.forEach((doc) => {
				const data = doc.data();
				const userId = doc.id;

				// ドキュメントIDが空でないことを確認
				if (userId && userId.trim() !== "") {
					USER_IDS.push(userId);
					USER_NAMES.push(data.displayName || data.nfcId || userId);
				}
			});

			console.log(`✅ ${USER_IDS.length}人のユーザーを取得しました`);

			// デバッグ情報
			console.log("取得したユーザーID:", USER_IDS);
			console.log("");
		} else {
			console.log(
				"⚠️  usersコレクションが空です。デフォルトのIDを使用します\n"
			);
		}

		// 各種データを作成
		await seedAttendance();
		await seedRaces();
		await seedBets();
		await seedTransfers();

		console.log("\n🎉 すべてのモックデータの作成が完了しました！");
		process.exit(0);
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(1);
	}
}

main();
