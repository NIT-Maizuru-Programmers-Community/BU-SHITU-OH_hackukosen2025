import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
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

async function clearCollection(collectionName: string) {
	console.log(`🗑️  ${collectionName} コレクションを削除中...`);

	const batchSize = 500;
	let deletedCount = 0;

	while (true) {
		const snapshot = await db.collection(collectionName).limit(batchSize).get();

		if (snapshot.empty) {
			break;
		}

		const batch = db.batch();
		snapshot.docs.forEach((doc) => {
			batch.delete(doc.ref);
		});

		await batch.commit();
		deletedCount += snapshot.size;

		console.log(`  削除済み: ${deletedCount}件`);
	}

	console.log(
		`✅ ${collectionName} コレクションの削除完了: ${deletedCount}件\n`
	);
}

async function main() {
	console.log("🧹 モックデータの削除を開始します...\n");

	const collections = ["attendance", "races", "bets", "transfers"];

	try {
		for (const collectionName of collections) {
			await clearCollection(collectionName);
		}

		console.log("🎉 すべてのモックデータの削除が完了しました！");
		process.exit(0);
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		process.exit(1);
	}
}

main();

