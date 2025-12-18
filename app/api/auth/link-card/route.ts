import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * ICカード連携API（アプリ用）
 * ユーザーがQRコードをスキャンして、自分のアカウントとICカードを連携
 */
export async function POST(request: NextRequest) {
	try {
		// Firebase Auth Token 検証
		const authHeader = request.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return NextResponse.json(
				{ error: "Authorization header required" },
				{ status: 401 }
			);
		}

		const token = authHeader.split("Bearer ")[1];
		const decodedToken = await adminAuth.verifyIdToken(token);
		const userId = decodedToken.uid;

		const { linkToken } = await request.json();

		if (!linkToken) {
			return NextResponse.json(
				{ error: "linkToken is required" },
				{ status: 400 }
			);
		}

		// linkToken で pending 登録を検索
		const pendingSnapshot = await adminDb
			.collection("pendingCardRegistrations")
			.where("linkToken", "==", linkToken)
			.where("status", "==", "pending")
			.limit(1)
			.get();

		if (pendingSnapshot.empty) {
			return NextResponse.json(
				{ error: "無効なトークンまたは期限切れです" },
				{ status: 404 }
			);
		}

		const pendingDoc = pendingSnapshot.docs[0];
		const pendingData = pendingDoc.data();

		// 期限チェック
		const expiresAt = pendingData.expiresAt.toDate();
		if (expiresAt < new Date()) {
			// 期限切れの場合は削除
			await adminDb
				.collection("pendingCardRegistrations")
				.doc(pendingDoc.id)
				.delete();

			return NextResponse.json(
				{ error: "トークンの期限が切れています" },
				{ status: 410 }
			);
		}

		const nfcCardId = pendingData.nfcCardId;

		// ユーザーが既にカードを登録しているかチェック
		const userDoc = await adminDb.collection("users").doc(userId).get();
		if (!userDoc.exists) {
			return NextResponse.json(
				{ error: "ユーザーが見つかりません" },
				{ status: 404 }
			);
		}

		const userData = userDoc.data();
		if (userData?.nfcCardId) {
			return NextResponse.json(
				{ error: "既にICカードが登録されています" },
				{ status: 409 }
			);
		}

		// カードが他のユーザーに登録されていないかチェック
		const existingCard = await adminDb
			.collection("users")
			.where("nfcCardId", "==", nfcCardId)
			.limit(1)
			.get();

		if (!existingCard.empty) {
			return NextResponse.json(
				{ error: "このICカードは既に他のユーザーに登録されています" },
				{ status: 409 }
			);
		}

		// トランザクションで連携処理
		await adminDb.runTransaction(async (transaction) => {
			const userRef = adminDb.collection("users").doc(userId);
			const pendingRef = adminDb
				.collection("pendingCardRegistrations")
				.doc(pendingDoc.id);

			// ユーザーにカードIDを登録
			transaction.update(userRef, {
				nfcCardId,
				updatedAt: FieldValue.serverTimestamp(),
			});

			// pending 登録を完了状態に更新
			transaction.update(pendingRef, {
				status: "completed",
				linkedUserId: userId,
				completedAt: FieldValue.serverTimestamp(),
			});
		});

		// レスポンス
		return NextResponse.json({
			success: true,
			message: "ICカードを連携しました",
			data: {
				userId,
				displayName: userData?.displayName,
				nfcCardId,
			},
		});
	} catch (error) {
		console.error("Link card error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

/**
 * トークン情報取得API（連携ページで使用）
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const linkToken = searchParams.get("token");

		if (!linkToken) {
			return NextResponse.json(
				{ error: "token parameter is required" },
				{ status: 400 }
			);
		}

		// linkToken で pending 登録を検索
		const pendingSnapshot = await adminDb
			.collection("pendingCardRegistrations")
			.where("linkToken", "==", linkToken)
			.where("status", "==", "pending")
			.limit(1)
			.get();

		if (pendingSnapshot.empty) {
			return NextResponse.json(
				{ error: "無効なトークンです" },
				{ status: 404 }
			);
		}

		const pendingDoc = pendingSnapshot.docs[0];
		const pendingData = pendingDoc.data();

		// 期限チェック
		const expiresAt = pendingData.expiresAt.toDate();
		if (expiresAt < new Date()) {
			return NextResponse.json(
				{ error: "トークンの期限が切れています" },
				{ status: 410 }
			);
		}

		return NextResponse.json({
			success: true,
			data: {
				nfcCardId: pendingData.nfcCardId,
				createdAt: pendingData.createdAt.toDate().toISOString(),
				expiresAt: expiresAt.toISOString(),
			},
		});
	} catch (error) {
		console.error("Get token info error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

