# API 実装完了報告

## 実装完了した API 一覧

すべての API エンドポイント（18 個）の実装が完了しました。

### 認証 API（3 個）

1. ✅ `POST /api/auth/register-nfc` - NFC カード登録
2. ✅ `POST /api/auth/nfc-login` - NFC ログイン（ログインボーナス付与）
3. ✅ `POST /api/auth/daily-bonus` - ログインボーナス手動取得

### ポイント管理 API（4 個）

4. ✅ `POST /api/points/award` - ポイント付与（ハードウェア用）
5. ✅ `POST /api/points/deduct` - ポイント減算（ハードウェア用）
6. ✅ `GET /api/points/balance` - ポイント残高取得
7. ✅ `GET /api/points/history` - ポイント履歴取得

### レース管理 API（4 個）

8. ✅ `GET /api/race/today` - 本日のレース情報取得
9. ✅ `POST /api/race/bet` - レースベット
10. ✅ `GET /api/race/result` - レース結果取得
11. ✅ `POST /api/race/predict` - レース予想記録

### 送金 API（2 個）

12. ✅ `POST /api/transfer/send` - ポイント送金
13. ✅ `GET /api/transfer/history` - 送金履歴取得

### 在室管理 API（4 個）

14. ✅ `POST /api/attendance/check-in` - チェックイン（入室）
15. ✅ `POST /api/attendance/check-out` - チェックアウト（退室）
16. ✅ `GET /api/attendance/current` - 在室者一覧取得
17. ✅ `GET /api/attendance/history` - 出席履歴取得

### ランキング API（1 個）

18. ✅ `GET /api/ranking` - ポイントランキング取得

## 実装した共通ユーティリティ

### 認証ミドルウェア（`lib/api/auth.ts`）

- `verifyAuth()` - Firebase Auth Token / API Key 認証
- `requireUserAuth()` - ユーザー認証必須
- `requireHardwareAuth()` - ハードウェア認証必須

### エラーハンドリング（`lib/api/errors.ts`）

- 統一されたエラーレスポンス形式
- エラーコード定義
- HTTP ステータスコードに応じたヘルパー関数

### バリデーション（`lib/api/validation.ts`）

- Zod を使用した入力検証
- すべてのエンドポイント用のスキーマ定義

### ポイント操作（`lib/api/points.ts`）

- `awardPoints()` - トランザクション処理でポイント付与
- `deductPoints()` - トランザクション処理でポイント減算
- `getUserBalance()` - ポイント残高取得

## 次のステップ

### 1. 環境変数の設定

`.env.local` ファイルを作成して以下の環境変数を設定してください：

```bash
# .env.local
cp .env.local.example .env.local
```

設定が必要な環境変数：

1. **Firebase Admin SDK の認証情報**

   - Firebase Console → プロジェクト設定 → サービスアカウント
   - 「新しい秘密鍵の生成」をクリック
   - ダウンロードした JSON ファイルから以下を設定：
     - `FIREBASE_ADMIN_PROJECT_ID`
     - `FIREBASE_ADMIN_CLIENT_EMAIL`
     - `FIREBASE_ADMIN_PRIVATE_KEY`

2. **ハードウェア用 API Key**

   - セキュアなランダム文字列を生成：
     ```bash
     openssl rand -base64 32
     ```
   - 生成された文字列を `HARDWARE_API_KEY` に設定

3. **Firebase クライアント設定**
   - Firebase Console → プロジェクト設定 → 全般
   - ウェブアプリの設定から取得

### 2. 必要なパッケージの確認

以下のパッケージが必要です：

```json
{
	"dependencies": {
		"firebase": "^10.x.x",
		"firebase-admin": "^12.x.x",
		"zod": "^3.x.x"
	}
}
```

まだインストールされていない場合：

```bash
npm install zod
```

### 3. Firestore セキュリティルール

Firestore のセキュリティルールを設定してください。API 経由でのアクセスのみを許可し、クライアントからの直接アクセスは制限することを推奨します。

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // デフォルトはすべて拒否
    match /{document=**} {
      allow read, write: if false;
    }

    // Server SDKからのみアクセス可能
  }
}
```

### 4. API のテスト

#### ハードウェアからのテスト（cURL）

```bash
# NFCログイン
curl -X POST http://localhost:3000/api/auth/nfc-login \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"nfcCardId": "1234567890ABCDEF"}'

# ポイント残高取得
curl -X GET "http://localhost:3000/api/points/balance?userId=user_uid" \
  -H "X-API-Key: your-api-key"

# 在室者一覧取得
curl -X GET http://localhost:3000/api/attendance/current
```

#### アプリからのテスト

Firebase Auth Token を取得して：

```bash
# ログインボーナス取得
curl -X POST http://localhost:3000/api/auth/daily-bonus \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"

# ポイント送金
curl -X POST http://localhost:3000/api/transfer/send \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "receiver_uid",
    "amount": 50,
    "message": "ありがとう！"
  }'
```

### 5. デプロイ前の確認事項

- [ ] `.env.local` を `.gitignore` に追加（既に含まれているはず）
- [ ] Vercel の環境変数に本番環境の値を設定
- [ ] Firebase プロジェクトの本番環境設定
- [ ] HARDWARE_API_KEY を安全に管理
- [ ] API のレート制限を検討

## トラブルシューティング

### エラー: "Firebase admin initialization error"

→ 環境変数が正しく設定されているか確認してください

### エラー: "Invalid API Key"

→ `HARDWARE_API_KEY` が設定されているか、リクエストヘッダーが正しいか確認してください

### エラー: "ユーザーが見つかりません"

→ Firebase Authentication でユーザーが作成され、Firestore の `users` コレクションにドキュメントが存在するか確認してください

## 実装の特徴

### セキュリティ

- 2 種類の認証方式（Firebase Auth Token / API Key）
- トランザクション処理によるデータ整合性の保証
- 入力値の厳密なバリデーション
- 権限チェック（自分のデータのみアクセス可能）

### エラーハンドリング

- 統一されたエラーレスポンス形式
- 適切な HTTP ステータスコード
- 詳細なエラーメッセージ

### パフォーマンス

- Firestore インデックスの活用
- 必要最小限のクエリ
- トランザクション処理の最適化

## 今後の拡張案

1. **レート制限の実装**

   - 悪用防止のため、API のレート制限を追加

2. **キャッシュの導入**

   - ランキングなど頻繁にアクセスされるデータをキャッシュ

3. **Webhook の追加**

   - ポイント付与時の通知など

4. **管理者用 API**

   - ユーザー管理、ポイント調整などの管理機能

5. **分析機能**
   - ポイント統計、レース分析などのレポート機能

