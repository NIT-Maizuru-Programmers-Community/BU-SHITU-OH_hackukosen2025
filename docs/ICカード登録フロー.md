# IC カード登録フロー

☆ 部室王 ☆ の IC カード登録の完全ガイドです。

---

## 概要

IC カードの登録は、**ハードウェア側で実施し、QR コードを使ってユーザーと連携する**方式を採用しています。

### メリット

- ✅ ユーザーはカード ID を入力する必要がない
- ✅ カードとアカウントの連携が簡単
- ✅ セキュリティが向上（カード ID が露出しない）
- ✅ ハードウェア側で一元管理できる

---

## フロー図

```
┌─────────────────────────────────────────────────────────────┐
│                    ICカード登録フロー                        │
└─────────────────────────────────────────────────────────────┘

1. [ユーザー]
   新しいICカードをNFCリーダーにタッチ
   ↓
2. [ハードウェア]
   カードIDを読み取り
   ↓
3. [ハードウェア → API]
   POST /api/auth/register-card
   { "nfcCardId": "1234567890ABCDEF" }
   ↓
4. [API]
   - 一時トークンを生成（32文字のランダム文字列）
   - pendingCardRegistrations コレクションに保存
   - 有効期限: 30分
   ↓
5. [API → ハードウェア]
   {
     "linkUrl": "https://app.example.com/auth/link-card?token=xxx",
     "linkToken": "abc123...",
     "expiresIn": 1800
   }
   ↓
6. [ハードウェア]
   QRコードを生成して画面に表示
   ↓
7. [ユーザー]
   スマホでQRコードをスキャン
   ↓
8. [アプリ]
   連携ページ（/auth/link-card）を開く
   ユーザーがログインしていない場合はログインを促す
   ↓
9. [ユーザー]
   「連携する」ボタンをタップ
   ↓
10. [アプリ → API]
    POST /api/auth/link-card
    {
      "linkToken": "abc123..."
    }
    Authorization: Bearer <firebase_id_token>
   ↓
11. [API]
    - トークンを検証
    - ユーザーのnfcCardIdを更新
    - pendingCardRegistrationsを完了状態に更新
   ↓
12. [アプリ]
    「連携完了」を表示
    ホーム画面に自動で戻る
   ↓
13. [完了]
    次回からそのICカードでログイン可能
```

---

## API 仕様

### 1. IC カード登録 API（ハードウェア用）

#### エンドポイント

```
POST /api/auth/register-card
```

#### リクエストヘッダー

```http
X-API-Key: <hardware_api_key>
Content-Type: application/json
```

#### リクエストボディ

```json
{
	"nfcCardId": "1234567890ABCDEF"
}
```

#### レスポンス（成功）

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

#### レスポンス（エラー: 既に登録済み）

```json
{
	"error": "このカードは既に登録されています"
}
```

HTTP Status: `409 Conflict`

---

### 2. IC カード連携 API（アプリ用）

#### エンドポイント

```
POST /api/auth/link-card
```

#### リクエストヘッダー

```http
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

#### リクエストボディ

```json
{
	"linkToken": "a1b2c3d4e5f6..."
}
```

#### レスポンス（成功）

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

#### レスポンス（エラー: 無効なトークン）

```json
{
	"error": "無効なトークンまたは期限切れです"
}
```

HTTP Status: `404 Not Found`

#### レスポンス（エラー: 既に連携済み）

```json
{
	"error": "既にICカードが登録されています"
}
```

HTTP Status: `409 Conflict`

---

### 3. トークン情報取得 API

連携ページでトークンの有効性を確認するための API。

#### エンドポイント

```
GET /api/auth/link-card?token=<link_token>
```

#### レスポンス（成功）

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

#### レスポンス（エラー: 期限切れ）

```json
{
	"error": "トークンの期限が切れています"
}
```

HTTP Status: `410 Gone`

---

## Firestore データ構造

### pendingCardRegistrations コレクション

一時的なカード登録情報を保存します。

```typescript
{
  nfcCardId: string;           // NFCカードID
  linkToken: string;           // 連携用トークン（32文字）
  status: "pending" | "completed" | "expired";  // ステータス
  linkedUserId?: string;       // 連携されたユーザーID（完了時）
  createdAt: Timestamp;        // 作成日時
  updatedAt: Timestamp;        // 更新日時
  completedAt?: Timestamp;     // 連携完了日時
  expiresAt: Timestamp;        // 有効期限（30分後）
}
```

### users コレクション（更新）

ユーザードキュメントに `nfcCardId` フィールドを追加します。

```typescript
{
  uid: string;
  displayName: string;
  email: string;
  nfcCardId?: string;         // 連携されたNFCカードID（オプショナル）
  totalPoints: number;
  isInRoom: boolean;
  // ... 他のフィールド
}
```

---

## ハードウェア実装

### 必要なライブラリ

```bash
pip3 install nfcpy requests python-dotenv qrcode[pil]
```

### 環境変数設定

`.env` ファイルを作成:

```bash
API_ENDPOINT=https://your-app.vercel.app
API_KEY=your-hardware-api-key-here
```

### スクリプト実行

```bash
# カード登録モードで起動
python3 hardware/nfc_card_registration.py
```

### 処理フロー（ハードウェア側）

1. NFC リーダーがカードを検出
2. カード ID を取得（16 進数）
3. API に登録リクエストを送信
4. レスポンスから QR コード用 URL を取得
5. QR コードを生成して画面に表示
6. ユーザーが連携するまで待機（最大 30 分）
7. カードが外れたら次のカードを待機

---

## フロントエンド実装

### 連携ページ

`app/auth/link-card/page.tsx`

- QR コードスキャン後に開くページ
- ログインチェック（未ログインの場合はログインページへ）
- トークン有効性確認
- 連携ボタン
- 連携完了後、ホームに自動リダイレクト

### フロー

1. QR コードをスキャン → `/auth/link-card?token=xxx` を開く
2. ログイン状態を確認
3. 未ログインの場合 → `/login?redirect=/auth/link-card?token=xxx`
4. ログイン済みの場合 → トークン情報を表示
5. 「連携する」ボタンをクリック
6. API に連携リクエストを送信
7. 成功 → 「連携完了」を表示 → 3 秒後にホームへ
8. エラー → エラーメッセージを表示

---

## セキュリティ考慮事項

### 1. トークンの有効期限

- **30 分間**の有効期限を設定
- 期限切れのトークンは自動的に無効化

### 2. トークンの一意性

- 32 文字のランダム文字列を使用
- crypto.randomBytes() で生成

### 3. 二重登録の防止

- カード ID が既に登録されている場合はエラー
- ユーザーが既にカードを持っている場合はエラー

### 4. API 認証

- ハードウェア側: `X-API-Key` ヘッダーで認証
- アプリ側: Firebase ID Token で認証

---

## トラブルシューティング

### カードが既に登録されているエラー

**原因**: 同じカードで複数回登録しようとした

**解決策**:

1. 既に登録されているユーザーを確認
2. 必要に応じて連携を解除してから再登録

```typescript
// Firestoreで確認
db.collection("users").where("nfcCardId", "==", "カードID").get();
```

### トークンの期限切れ

**原因**: 30 分以内に連携が完了しなかった

**解決策**:

1. もう一度カードをタッチして新しい QR コードを生成
2. 有効期限内に連携を完了する

### QR コードが表示されない

**原因**: ハードウェア側で画像ビューアーが起動しない

**解決策**:

1. 生成された `qr_*.png` ファイルを手動で開く
2. スクリプトをカスタマイズして、ディスプレイに直接表示する

---

## 定期クリーンアップ

期限切れの `pendingCardRegistrations` を定期的に削除することを推奨します。

### Cloud Functions でのクリーンアップ例

```typescript
import * as functions from "firebase-functions";
import { adminDb } from "./firebase-admin";

export const cleanupExpiredRegistrations = functions.pubsub
	.schedule("every 1 hours")
	.onRun(async (context) => {
		const now = new Date();

		const expiredDocs = await adminDb
			.collection("pendingCardRegistrations")
			.where("expiresAt", "<", now)
			.get();

		const batch = adminDb.batch();

		expiredDocs.forEach((doc) => {
			batch.delete(doc.ref);
		});

		await batch.commit();

		console.log(`Deleted ${expiredDocs.size} expired registrations`);
	});
```

---

## まとめ

このフローを採用することで：

- ✅ ユーザーはカード ID を手入力する必要がない
- ✅ QR コードスキャンで簡単に連携できる
- ✅ セキュリティが向上（トークンベース）
- ✅ ハードウェア側で一元管理できる

**次のステップ**:

1. ハードウェアスクリプトのセットアップ
2. Vercel に環境変数を設定（`HARDWARE_API_KEY`, `NEXT_PUBLIC_APP_URL`）
3. テスト実行
4. ディスプレイへの QR コード表示方法を調整

