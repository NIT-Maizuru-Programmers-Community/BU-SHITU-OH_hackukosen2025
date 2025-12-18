import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

// API キー検証 (環境変数に設定)
const API_KEY = process.env.HARDWARE_API_KEY;

/**
 * ICカード登録API（ハードウェア用）
 * ハードウェアがICカードを読み取り、一時トークンとQRコードURLを取得
 */
export async function POST(request: NextRequest) {
	try {
		// API キー検証
		const apiKey = request.headers.get("X-API-Key");
		if (apiKey !== API_KEY) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { nfcCardId } = await request.json();

		if (!nfcCardId) {
			return NextResponse.json(
				{ error: "nfcCardId is required" },
				{ status: 400 }
			);
		}

		// 既に登録されているカードかチェック
		const existingCard = await adminDb
			.collection("users")
			.where("nfcCardId", "==", nfcCardId)
			.limit(1)
			.get();

		if (!existingCard.empty) {
			return NextResponse.json(
				{ error: "このカードは既に登録されています" },
				{ status: 409 }
			);
		}

		// pendingCardRegistrations コレクションに既に登録されているかチェック
		const existingPending = await adminDb
			.collection("pendingCardRegistrations")
			.where("nfcCardId", "==", nfcCardId)
			.where("status", "==", "pending")
			.limit(1)
			.get();

		let linkToken: string;
		let registrationId: string;

		if (!existingPending.empty) {
			// 既に pending の登録がある場合は、そのトークンを再利用
			const doc = existingPending.docs[0];
			linkToken = doc.data().linkToken;
			registrationId = doc.id;

			// タイムスタンプを更新
			await adminDb
				.collection("pendingCardRegistrations")
				.doc(registrationId)
				.update({
					updatedAt: FieldValue.serverTimestamp(),
				});
		} else {
			// 新しい一時トークンを生成（32文字のランダム文字列）
			linkToken = crypto.randomBytes(16).toString("hex");

			// pendingCardRegistrations コレクションに保存
			const registrationRef = await adminDb
				.collection("pendingCardRegistrations")
				.add({
					nfcCardId,
					linkToken,
					status: "pending",
					createdAt: FieldValue.serverTimestamp(),
					updatedAt: FieldValue.serverTimestamp(),
					expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分後に期限切れ
				});

			registrationId = registrationRef.id;
		}

		// QRコード用のURL（フロントエンドの連携ページ）
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const linkUrl = `${baseUrl}/auth/link-card?token=${linkToken}`;

		// レスポンス
		return NextResponse.json({
			success: true,
			message: "ICカードの登録トークンを生成しました",
			data: {
				registrationId,
				linkToken,
				linkUrl,
				nfcCardId,
				expiresIn: 1800, // 30分（秒）
			},
		});
	} catch (error) {
		console.error("Register card error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

