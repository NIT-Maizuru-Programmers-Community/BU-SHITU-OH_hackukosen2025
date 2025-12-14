import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

/**
 * 認証結果の型
 */
export type AuthResult =
	| {
			type: "hardware";
			authorized: true;
	  }
	| {
			type: "user";
			authorized: true;
			uid: string;
	  }
	| {
			authorized: false;
			error: string;
	  };

/**
 * リクエストの認証を検証
 * - API Key認証（ハードウェア用）
 * - Firebase Auth Token認証（アプリ用）
 */
export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
	try {
		// API Key認証（ハードウェア用）
		const apiKey = req.headers.get("X-API-Key");
		if (apiKey) {
			const hardwareApiKey = process.env.HARDWARE_API_KEY;
			if (!hardwareApiKey) {
				return {
					authorized: false,
					error: "サーバー設定エラー: API Keyが設定されていません",
				};
			}
			if (apiKey === hardwareApiKey) {
				return { type: "hardware", authorized: true };
			}
			return { authorized: false, error: "無効なAPI Key" };
		}

		// Firebase Auth Token認証（アプリ用）
		const authHeader = req.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return {
				authorized: false,
				error: "認証情報が必要です",
			};
		}

		const token = authHeader.split("Bearer ")[1];
		if (!token) {
			return {
				authorized: false,
				error: "トークンが見つかりません",
			};
		}

		const decodedToken = await adminAuth.verifyIdToken(token);

		return {
			type: "user",
			authorized: true,
			uid: decodedToken.uid,
		};
	} catch (error) {
		console.error("認証エラー:", error);
		return {
			authorized: false,
			error: "認証に失敗しました",
		};
	}
}

/**
 * ユーザー認証を要求（Firebase Auth Token必須）
 */
export async function requireUserAuth(
	req: NextRequest
): Promise<
	{ authorized: true; uid: string } | { authorized: false; error: string }
> {
	const auth = await verifyAuth(req);
	if (!auth.authorized) {
		return auth;
	}
	if (auth.type !== "user") {
		return {
			authorized: false,
			error: "ユーザー認証が必要です",
		};
	}
	return { authorized: true, uid: auth.uid };
}

/**
 * ハードウェア認証を要求（API Key必須）
 */
export async function requireHardwareAuth(
	req: NextRequest
): Promise<{ authorized: true } | { authorized: false; error: string }> {
	const auth = await verifyAuth(req);
	if (!auth.authorized) {
		return auth;
	}
	if (auth.type !== "hardware") {
		return {
			authorized: false,
			error: "ハードウェア認証が必要です",
		};
	}
	return { authorized: true };
}

