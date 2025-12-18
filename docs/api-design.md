# 部室王 API 設計書

## 概要

ハードウェア（NFC リーダー等）と Firebase の通信を仲介する API 設計書です。Next.js API Routes を使用して実装します。

## 認証方式

すべての API エンドポイントは以下のいずれかの認証方式を使用します：

### 1. Firebase Auth Token（アプリ用）

```http
Authorization: Bearer <firebase_id_token>
```

### 2. API Key（ハードウェア用）

```http
X-API-Key: <api_key>
```

ハードウェアからのリクエストは、環境変数 `HARDWARE_API_KEY` で検証します。

---

## エンドポイント一覧

### 認証・ユーザー管理

#### 1. IC カード登録（ハードウェア用）

ハードウェアが IC カードを読み取り、QR コード用のトークンを生成します。

```
POST /api/auth/register-card
```

**リクエストヘッダー**

```
X-API-Key: <api_key>
```

**リクエストボディ**

```json
{
	"nfcCardId": "1234567890ABCDEF"
}
```

**レスポンス**

```json
{
	"success": true,
	"message": "ICカードの登録トークンを生成しました",
	"data": {
		"registrationId": "reg_abc123",
		"linkToken": "a1b2c3d4e5f6...",
		"linkUrl": "https://app.example.com/auth/link-card?token=a1b2c3d4e5f6...",
		"nfcCardId": "1234567890ABCDEF",
		"expiresIn": 1800
	}
}
```

**エラーレスポンス**

```json
{
	"error": "このカードは既に登録されています"
}
```

**処理内容**

- カードが既に登録されていないかチェック
- 一時トークン（32 文字）を生成
- pendingCardRegistrations コレクションに保存（有効期限: 30 分）
- QR コード用の URL を返す

---

#### 2. IC カード連携（アプリ用）

ユーザーが QR コードをスキャンして、自分のアカウントと IC カードを連携します。

```
POST /api/auth/link-card
```

**リクエストヘッダー**

```
Authorization: Bearer <firebase_id_token>
```

**リクエストボディ**

```json
{
	"linkToken": "a1b2c3d4e5f6..."
}
```

**レスポンス**

```json
{
	"success": true,
	"message": "ICカードを連携しました",
	"data": {
		"userId": "user_uid",
		"displayName": "田中太郎",
		"nfcCardId": "1234567890ABCDEF"
	}
}
```

**エラーレスポンス**

```json
{
	"error": "無効なトークンまたは期限切れです"
}
```

**処理内容**

- トークンの有効性を確認
- ユーザーが既にカードを持っていないかチェック
- カードが他のユーザーに登録されていないかチェック
- ユーザーの nfcCardId を更新
- pendingCardRegistrations を完了状態に更新

---

#### 3. トークン情報取得

連携ページでトークンの有効性を確認するための API。

```
GET /api/auth/link-card?token=<link_token>
```

**レスポンス**

```json
{
	"success": true,
	"data": {
		"nfcCardId": "1234567890ABCDEF",
		"createdAt": "2025-12-15T10:00:00Z",
		"expiresAt": "2025-12-15T10:30:00Z"
	}
}
```

---

#### 4. NFC ログイン（ハードウェア用）

登録済みの NFC カードをかざしてログインします。ログインボーナスも自動付与されます。

```
POST /api/auth/nfc-login
または
POST /api/attendance/checkin
```

**リクエストボディ**

```json
{
	"nfcCardId": "1234567890ABCDEF"
}
```

**レスポンス**

```json
{
	"success": true,
	"message": "ログインしました",
	"user": {
		"uid": "user_uid",
		"displayName": "田中太郎",
		"totalPoints": 150
	},
	"bonus": {
		"awarded": true,
		"points": 10,
		"message": "ログインボーナス +10pt"
	},
	"checkIn": {
		"status": "in",
		"checkInTime": "2025-12-11T10:00:00Z"
	}
}
```

**エラーレスポンス**

```json
{
	"success": false,
	"error": "このカードは登録されていません"
}
```

**処理内容**

- NFC カード ID からユーザーを検索
- ログインボーナス判定（1 日 1 回）
- ボーナスポイント付与（10pt）
- 在室状態を更新（`isInRoom = true`）
- 入室時刻を記録（`checkInTime`）
- ポイント履歴に記録

---

#### 5. ログインボーナス手動取得

アプリから手動でログインボーナスを取得します。

```
POST /api/auth/daily-bonus
```

**リクエストヘッダー**

```
Authorization: Bearer <firebase_id_token>
```

**レスポンス**

```json
{
	"success": true,
	"points": 10,
	"message": "ログインボーナスを獲得しました",
	"totalPoints": 150
}
```

**エラーレスポンス**

```json
{
	"success": false,
	"error": "本日のログインボーナスは既に受け取り済みです"
}
```

---

### ポイント管理

#### 6. ポイント付与（ハードウェア用）

ハードウェアから直接ポイントを付与します。

```
POST /api/points/award
```

**リクエストヘッダー**

```
X-API-Key: <api_key>
```

**リクエストボディ**

```json
{
	"userId": "user_uid",
	"amount": 50,
	"type": "login_bonus",
	"description": "NFCログインボーナス",
	"relatedId": "optional_related_id"
}
```

**type の種類**

- `login_bonus`: ログインボーナス
- `race_win`: レース勝利
- `race_bet`: レースベット当選
- `transfer_receive`: 送金受取
- `reset`: リセット
- `manual`: 手動付与

**レスポンス**

```json
{
	"success": true,
	"message": "ポイントを付与しました",
	"transaction": {
		"id": "transaction_id",
		"userId": "user_uid",
		"amount": 50,
		"type": "login_bonus",
		"newBalance": 200,
		"createdAt": "2025-12-11T10:00:00Z"
	}
}
```

---

#### 7. ポイント減算（ハードウェア用）

ハードウェアから直接ポイントを減算します（ベット等で使用）。

```
POST /api/points/deduct
```

**リクエストヘッダー**

```
X-API-Key: <api_key>
```

**リクエストボディ**

```json
{
	"userId": "user_uid",
	"amount": 30,
	"type": "race_bet",
	"description": "レースベット",
	"relatedId": "race_id"
}
```

**レスポンス**

```json
{
	"success": true,
	"message": "ポイントを使用しました",
	"transaction": {
		"id": "transaction_id",
		"userId": "user_uid",
		"amount": -30,
		"type": "race_bet",
		"newBalance": 170,
		"createdAt": "2025-12-11T11:00:00Z"
	}
}
```

**エラーレスポンス**

```json
{
	"success": false,
	"error": "ポイントが不足しています",
	"currentBalance": 20,
	"required": 30
}
```

---

#### 8. ポイント残高取得

ユーザーの現在のポイント残高を取得します。

```
GET /api/points/balance?userId=user_uid
```

**リクエストヘッダー**

```
Authorization: Bearer <firebase_id_token>
または
X-API-Key: <api_key>
```

**レスポンス**

```json
{
	"success": true,
	"userId": "user_uid",
	"displayName": "田中太郎",
	"totalPoints": 170,
	"updatedAt": "2025-12-11T11:00:00Z"
}
```

---

#### 9. ポイント履歴取得

ユーザーのポイント履歴を取得します。

```
GET /api/points/history?userId=user_uid&limit=50&type=all
```

**クエリパラメータ**

- `userId`: ユーザー UID（必須）
- `limit`: 取得件数（デフォルト: 50）
- `type`: フィルタリングタイプ（`all` | `login_bonus` | `race_win` | `race_bet` | `transfer_send` | `transfer_receive`）

**リクエストヘッダー**

```
Authorization: Bearer <firebase_id_token>
```

**レスポンス**

```json
{
	"success": true,
	"userId": "user_uid",
	"history": [
		{
			"id": "history_id_1",
			"amount": -30,
			"type": "race_bet",
			"description": "レースベット",
			"relatedId": "race_id",
			"createdAt": "2025-12-11T11:00:00Z"
		},
		{
			"id": "history_id_2",
			"amount": 50,
			"type": "login_bonus",
			"description": "ログインボーナス",
			"createdAt": "2025-12-11T10:00:00Z"
		}
	],
	"total": 2
}
```

---

### レース管理

#### 10. 本日のレース情報取得

本日開催されるレースの情報を取得します。

```
GET /api/race/today
```

**レスポンス**

```json
{
	"success": true,
	"race": {
		"id": "race_id",
		"date": "2025-12-11",
		"status": "open",
		"participants": [
			{
				"userId": "user_uid_1",
				"displayName": "田中太郎",
				"totalBets": 150
			},
			{
				"userId": "user_uid_2",
				"displayName": "鈴木花子",
				"totalBets": 200
			}
		],
		"startTime": "2025-12-11T09:00:00Z",
		"endTime": "2025-12-11T18:00:00Z",
		"totalPool": 350
	}
}
```

**status の種類**

- `open`: 開催中（ベット可能）
- `closed`: 締切（結果待ち）
- `finished`: 終了（結果確定）

---

#### 11. レースベット（ハードウェア用）

ハードウェアからレースにベットします。

```
POST /api/race/bet
```

**リクエストヘッダー**

```
X-API-Key: <api_key>
```

**リクエストボディ**

```json
{
	"userId": "user_uid",
	"raceId": "race_id",
	"targetUserId": "target_user_uid",
	"amount": 30
}
```

**レスポンス**

```json
{
	"success": true,
	"message": "ベットしました",
	"bet": {
		"id": "bet_id",
		"raceId": "race_id",
		"userId": "user_uid",
		"targetUserId": "target_user_uid",
		"amount": 30,
		"createdAt": "2025-12-11T11:00:00Z"
	},
	"newBalance": 170
}
```

**エラーレスポンス**

```json
{
	"success": false,
	"error": "レースは既に締め切られています"
}
```

---

#### 12. レース結果取得

レースの結果を取得します。

```
GET /api/race/result?raceId=race_id
```

**レスポンス**

```json
{
	"success": true,
	"race": {
		"id": "race_id",
		"date": "2025-12-11",
		"status": "finished",
		"results": [
			{
				"rank": 1,
				"userId": "user_uid_1",
				"displayName": "田中太郎",
				"stayDuration": 540
			},
			{
				"rank": 2,
				"userId": "user_uid_2",
				"displayName": "鈴木花子",
				"stayDuration": 480
			}
		],
		"payouts": [
			{
				"userId": "bettor_uid",
				"betAmount": 30,
				"payout": 60,
				"profit": 30
			}
		]
	}
}
```

---

#### 13. レース予想の記録

ログイン時にレースの予想を記録します（ログインボーナスに関連）。

```
POST /api/race/predict
```

**リクエストボディ**

```json
{
	"userId": "user_uid",
	"raceId": "race_id",
	"predictedUserId": "predicted_winner_uid"
}
```

**レスポンス**

```json
{
	"success": true,
	"message": "予想を記録しました",
	"prediction": {
		"id": "prediction_id",
		"userId": "user_uid",
		"raceId": "race_id",
		"predictedUserId": "predicted_winner_uid",
		"createdAt": "2025-12-11T10:00:00Z"
	}
}
```

**処理内容**

- 予想が的中した場合、ログインボーナスにボーナスポイント追加（+5pt 等）

---

### スパチャ（送金）管理

#### 14. ポイント送金

他のユーザーにポイントを送金します。

```
POST /api/transfer/send
```

**リクエストヘッダー**

```
Authorization: Bearer <firebase_id_token>
```

**リクエストボディ**

```json
{
	"receiverId": "receiver_uid",
	"amount": 50,
	"message": "プログラミング教えてくれてありがとう！"
}
```

**レスポンス**

```json
{
	"success": true,
	"message": "送金しました",
	"transfer": {
		"id": "transfer_id",
		"senderId": "sender_uid",
		"senderName": "田中太郎",
		"receiverId": "receiver_uid",
		"receiverName": "鈴木花子",
		"amount": 50,
		"message": "プログラミング教えてくれてありがとう！",
		"createdAt": "2025-12-11T12:00:00Z"
	},
	"newBalance": 120
}
```

**エラーレスポンス**

```json
{
	"success": false,
	"error": "ポイントが不足しています",
	"currentBalance": 30,
	"required": 50
}
```

---

#### 15. 送金履歴取得

送金・受信の履歴を取得します。

```
GET /api/transfer/history?userId=user_uid&limit=50&direction=all
```

**クエリパラメータ**

- `userId`: ユーザー UID（必須）
- `limit`: 取得件数（デフォルト: 50）
- `direction`: フィルタリング（`all` | `sent` | `received`）

**リクエストヘッダー**

```
Authorization: Bearer <firebase_id_token>
```

**レスポンス**

```json
{
	"success": true,
	"transfers": [
		{
			"id": "transfer_id",
			"senderId": "sender_uid",
			"senderName": "田中太郎",
			"receiverId": "receiver_uid",
			"receiverName": "鈴木花子",
			"amount": 50,
			"message": "ありがとう！",
			"direction": "sent",
			"createdAt": "2025-12-11T12:00:00Z"
		}
	],
	"total": 1
}
```

---

### 在室状況管理

#### 16. チェックイン（入室）

NFC ログイン時に自動で呼び出されます。手動でも呼び出し可能。

```
POST /api/attendance/check-in
または
POST /api/attendance/checkin
```

**リクエストヘッダー**

```
X-API-Key: <api_key>
または
Authorization: Bearer <firebase_id_token>
```

**リクエストボディ**

```json
{
	"userId": "user_uid"
}
```

**レスポンス**

```json
{
	"success": true,
	"message": "チェックインしました",
	"attendance": {
		"userId": "user_uid",
		"displayName": "田中太郎",
		"status": "in",
		"checkInTime": "2025-12-11T10:00:00Z"
	}
}
```

---

#### 17. チェックアウト（退室） なしになりました

NFC リーダーで退室を検知するか、手動で呼び出します。

```
POST /api/attendance/check-out
または
POST /api/attendance/checkout
```

**リクエストヘッダー**

```
X-API-Key: <api_key>
または
Authorization: Bearer <firebase_id_token>
```

**リクエストボディ**

```json
{
	"userId": "user_uid"
}
```

**レスポンス**

```json
{
	"success": true,
	"message": "チェックアウトしました",
	"attendance": {
		"userId": "user_uid",
		"displayName": "田中太郎",
		"status": "out",
		"checkInTime": "2025-12-11T10:00:00Z",
		"checkOutTime": "2025-12-11T18:00:00Z",
		"duration": 480
	}
}
```

---

#### 18. 在室者一覧取得

現在部室にいる人の一覧を取得します。

```
GET /api/attendance/current
```

**レスポンス**

```json
{
	"success": true,
	"members": [
		{
			"userId": "user_uid_1",
			"displayName": "田中太郎",
			"checkInTime": "2025-12-11T10:00:00Z",
			"duration": 120
		},
		{
			"userId": "user_uid_2",
			"displayName": "鈴木花子",
			"checkInTime": "2025-12-11T11:00:00Z",
			"duration": 60
		}
	],
	"total": 2
}
```

---

#### 19. 出席履歴取得

特定のユーザーの出席履歴を取得します。

```
GET /api/attendance/history?userId=user_uid&limit=30
```

**クエリパラメータ**

- `userId`: ユーザー UID（必須）
- `limit`: 取得件数（デフォルト: 30）

**リクエストヘッダー**

```
Authorization: Bearer <firebase_id_token>
```

**レスポンス**

```json
{
	"success": true,
	"history": [
		{
			"id": "attendance_id",
			"userId": "user_uid",
			"checkInTime": "2025-12-11T10:00:00Z",
			"checkOutTime": "2025-12-11T18:00:00Z",
			"duration": 480
		},
		{
			"id": "attendance_id_2",
			"userId": "user_uid",
			"checkInTime": "2025-12-10T09:00:00Z",
			"checkOutTime": "2025-12-10T17:00:00Z",
			"duration": 480
		}
	],
	"total": 2
}
```

---

### ランキング管理

#### 20. ランキング取得

ポイントランキングを取得します。

```
GET /api/ranking?limit=100
```

**クエリパラメータ**

- `limit`: 取得件数（デフォルト: 100）

**レスポンス**

```json
{
	"success": true,
	"ranking": [
		{
			"rank": 1,
			"userId": "user_uid_1",
			"displayName": "田中太郎",
			"totalPoints": 1500,
			"isPresident": true
		},
		{
			"rank": 2,
			"userId": "user_uid_2",
			"displayName": "鈴木花子",
			"totalPoints": 1200,
			"isPresident": false
		}
	],
	"total": 2,
	"updatedAt": "2025-12-11T12:00:00Z"
}
```

**isPresident について**

- 1 位のユーザーは社長となり、`isPresident: true` が付与されます

---

## エラーハンドリング

すべての API は統一されたエラーレスポンス形式を返します。

### エラーレスポンス形式

```json
{
	"success": false,
	"error": "エラーメッセージ",
	"code": "ERROR_CODE",
	"details": {}
}
```

### HTTP ステータスコード

| コード | 説明                                 |
| ------ | ------------------------------------ |
| 200    | 成功                                 |
| 400    | リクエストエラー（パラメータ不正等） |
| 401    | 認証エラー                           |
| 403    | 権限エラー                           |
| 404    | リソースが見つからない               |
| 409    | 競合エラー（既に存在する等）         |
| 500    | サーバーエラー                       |

### エラーコード一覧

| コード                | 説明                     |
| --------------------- | ------------------------ |
| `INVALID_REQUEST`     | リクエストが不正         |
| `UNAUTHORIZED`        | 認証が必要               |
| `FORBIDDEN`           | アクセス権限がない       |
| `NOT_FOUND`           | リソースが見つからない   |
| `ALREADY_EXISTS`      | 既に存在する             |
| `INSUFFICIENT_POINTS` | ポイント不足             |
| `RACE_CLOSED`         | レースが締め切られている |
| `DAILY_BONUS_CLAIMED` | ログインボーナス取得済み |
| `INVALID_NFC_CARD`    | 無効な NFC カード        |
| `SERVER_ERROR`        | サーバーエラー           |

---

## 実装ガイド

### ディレクトリ構成

```
app/api/
├── auth/
│   ├── register-nfc/
│   │   └── route.ts
│   ├── nfc-login/
│   │   └── route.ts
│   └── daily-bonus/
│       └── route.ts
├── points/
│   ├── award/
│   │   └── route.ts
│   ├── deduct/
│   │   └── route.ts
│   ├── balance/
│   │   └── route.ts
│   └── history/
│       └── route.ts
├── race/
│   ├── today/
│   │   └── route.ts
│   ├── bet/
│   │   └── route.ts
│   ├── result/
│   │   └── route.ts
│   └── predict/
│       └── route.ts
├── transfer/
│   ├── send/
│   │   └── route.ts
│   └── history/
│       └── route.ts
├── attendance/
│   ├── check-in/
│   │   └── route.ts
│   ├── check-out/
│   │   └── route.ts
│   ├── current/
│   │   └── route.ts
│   └── history/
│       └── route.ts
└── ranking/
    └── route.ts
```

### 認証ミドルウェア実装例

```typescript
// lib/api-auth.ts
import { NextRequest } from "next/server";
import { auth } from "@/lib/firebase-admin";

export async function verifyAuth(req: NextRequest) {
	// API Key認証（ハードウェア用）
	const apiKey = req.headers.get("X-API-Key");
	if (apiKey) {
		if (apiKey === process.env.HARDWARE_API_KEY) {
			return { type: "hardware", authorized: true };
		}
		throw new Error("Invalid API Key");
	}

	// Firebase Auth Token認証（アプリ用）
	const authHeader = req.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new Error("Authorization header required");
	}

	const token = authHeader.split("Bearer ")[1];
	const decodedToken = await auth.verifyIdToken(token);

	return {
		type: "user",
		authorized: true,
		uid: decodedToken.uid,
	};
}
```

### トランザクション処理の実装

ポイント付与・減算は必ずトランザクション処理で行います。

```typescript
// lib/points.ts
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function awardPoints(
	userId: string,
	amount: number,
	type: string,
	description: string,
	relatedId?: string
) {
	const userRef = db.collection("users").doc(userId);
	const historyRef = db.collection("points").doc();

	await db.runTransaction(async (transaction) => {
		const userDoc = await transaction.get(userRef);

		if (!userDoc.exists) {
			throw new Error("User not found");
		}

		const currentPoints = userDoc.data()?.totalPoints || 0;
		const newPoints = currentPoints + amount;

		// ユーザーのポイント更新
		transaction.update(userRef, {
			totalPoints: newPoints,
			updatedAt: FieldValue.serverTimestamp(),
		});

		// 履歴の記録
		transaction.set(historyRef, {
			oderId: userId,
			amount,
			type,
			description,
			relatedId: relatedId || null,
			createdAt: FieldValue.serverTimestamp(),
		});
	});

	return historyRef.id;
}
```

---

## セキュリティ考慮事項

### 1. API Key 管理

ハードウェア用の API Key は環境変数で管理し、絶対にコミットしないこと。

```bash
# .env.local
HARDWARE_API_KEY=your-secure-random-api-key-here
```

### 2. レート制限

各エンドポイントにレート制限を設定することを推奨します。

```typescript
// lib/rate-limit.ts
import { LRUCache } from "lru-cache";

const ratelimit = new LRUCache({
	max: 500,
	ttl: 60000, // 1分
});

export function rateLimitCheck(identifier: string, limit: number = 10) {
	const count = (ratelimit.get(identifier) as number) || 0;

	if (count >= limit) {
		throw new Error("Rate limit exceeded");
	}

	ratelimit.set(identifier, count + 1);
}
```

### 3. 入力バリデーション

すべての入力パラメータを検証します。

```typescript
// lib/validation.ts
import { z } from "zod";

export const awardPointsSchema = z.object({
	userId: z.string().min(1),
	amount: z.number().int().positive().max(10000),
	type: z.enum([
		"login_bonus",
		"race_win",
		"race_bet",
		"transfer_receive",
		"reset",
		"manual",
	]),
	description: z.string().max(200),
	relatedId: z.string().optional(),
});
```

---

## テスト方法

### cURL でのテスト例

#### NFC ログイン

```bash
curl -X POST http://localhost:3000/api/auth/nfc-login \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"nfcCardId": "1234567890ABCDEF"}'
```

#### ポイント残高取得

```bash
curl -X GET "http://localhost:3000/api/points/balance?userId=user_uid" \
  -H "Authorization: Bearer your-firebase-token"
```

#### レースベット

```bash
curl -X POST http://localhost:3000/api/race/bet \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_uid",
    "raceId": "race_id",
    "targetUserId": "target_user_uid",
    "amount": 30
  }'
```

---

## 次のステップ

1. **Firebase Admin SDK のセットアップ**

   - `lib/firebase-admin.ts` を作成
   - サービスアカウントキーを設定

2. **API エンドポイントの実装**

   - 認証機能から順次実装
   - トランザクション処理を確実に実装

3. **ハードウェア連携テスト**

   - NFC リーダーとの通信テスト
   - エラーハンドリングの確認

4. **ドキュメント整備**
   - ハードウェア開発者向けの API 利用ガイド作成
   - エンドポイントごとのサンプルコード提供
