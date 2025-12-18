# API テスト結果

## テスト実施日時

2025 年 12 月 12 日

## テスト環境

- Node.js: v20.x
- Next.js: 16.0.8
- Firebase: 既存の Firebase プロジェクトに接続

## テスト結果サマリー

### ✅ 成功したエンドポイント

#### 認証不要のエンドポイント

1. **GET /api/ranking** - ✅ 成功

   - ポイントランキングを正常に取得
   - 既存ユーザー（辻本健斗さん、10pt）が 1 位として表示

2. **GET /api/attendance/current** - ✅ 成功

   - 現在在室者一覧を正常に取得
   - 現在在室者なし（期待通り）

3. **GET /api/race/today** - ✅ 成功
   - 本日のレース情報を正常に取得
   - レース未作成のため、適切なメッセージを返却

#### 認証が必要なエンドポイント

4. **GET /api/points/balance** (認証なし) - ✅ エラーハンドリング成功
   - 認証エラーを正しく返却
   - エラーコード: `UNAUTHORIZED`
   - エラーメッセージ: "認証情報が必要です"

## テスト詳細

### 1. ランキング API

**リクエスト:**

```bash
curl http://localhost:3000/api/ranking
```

**レスポンス:**

```json
{
	"success": true,
	"ranking": [
		{
			"rank": 1,
			"userId": "SQcqjqIAd4TEFTRHPiosilZSa323",
			"displayName": "辻本健斗",
			"photoURL": "https://lh3.googleusercontent.com/...",
			"totalPoints": 10,
			"isPresident": true
		}
	],
	"total": 1,
	"updatedAt": "2025-12-12T12:38:32.137Z"
}
```

**確認事項:**

- ✅ `success: true` が返却される
- ✅ ランキングデータが配列で返却される
- ✅ `isPresident: true` が 1 位のユーザーに設定されている
- ✅ タイムスタンプが正しく設定されている

### 2. 在室者一覧 API

**リクエスト:**

```bash
curl http://localhost:3000/api/attendance/current
```

**レスポンス:**

```json
{
	"success": true,
	"members": [],
	"total": 0
}
```

**確認事項:**

- ✅ `success: true` が返却される
- ✅ 在室者がいない場合、空配列が返却される
- ✅ `total: 0` が正しく設定されている

### 3. 本日のレース API

**リクエスト:**

```bash
curl http://localhost:3000/api/race/today
```

**レスポンス:**

```json
{
	"success": true,
	"race": null,
	"message": "本日のレースはまだ作成されていません"
}
```

**確認事項:**

- ✅ `success: true` が返却される
- ✅ レース未作成時に適切なメッセージが返却される
- ✅ `race: null` が正しく設定されている

### 4. 認証エラーのテスト

**リクエスト:**

```bash
curl http://localhost:3000/api/points/balance?userId=xxx
```

**レスポンス:**

```json
{
	"success": false,
	"error": "認証情報が必要です",
	"code": "UNAUTHORIZED"
}
```

**確認事項:**

- ✅ `success: false` が返却される
- ✅ 適切なエラーメッセージが返却される
- ✅ エラーコードが統一形式で返却される

## 既知の課題

### ハードウェア認証 API のテスト

以下のエンドポイントは、`HARDWARE_API_KEY` が必要なため、手動でのテストが必要です：

- `POST /api/auth/register-nfc`
- `POST /api/auth/nfc-login`
- `POST /api/points/award`
- `POST /api/points/deduct`
- `POST /api/race/bet`
- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`

### ユーザー認証 API のテスト

以下のエンドポイントは、Firebase Auth Token が必要なため、フロントエンドからのテストが必要です：

- `POST /api/auth/daily-bonus`
- `GET /api/points/history`
- `POST /api/transfer/send`
- `GET /api/transfer/history`
- `GET /api/attendance/history`

## 次のステップ

### 1. ハードウェア認証のテスト

`.env.local` の `HARDWARE_API_KEY` を使用して、以下をテスト：

```bash
export HARDWARE_API_KEY="your-api-key"
export TEST_USER_ID="SQcqjqIAd4TEFTRHPiosilZSa323"

# NFCカード登録
curl -X POST http://localhost:3000/api/auth/register-nfc \
  -H "X-API-Key: $HARDWARE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "nfcCardId": "TEST_CARD_001",
    "userId": "'$TEST_USER_ID'"
  }'

# ポイント付与
curl -X POST http://localhost:3000/api/points/award \
  -H "X-API-Key: $HARDWARE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "amount": 50,
    "type": "manual",
    "description": "テストポイント"
  }'
```

### 2. フロントエンドからのテスト

アプリにログインして、以下をテスト：

- ログインボーナスの取得
- ポイント送金
- ポイント履歴の閲覧
- 出席履歴の閲覧

### 3. エッジケースのテスト

- ポイント不足時の送金
- 無効なユーザー ID の指定
- 重複する NFC カード登録
- レース締切後のベット

### 4. パフォーマンステスト

- 大量のユーザーデータでのランキング取得
- 複数の同時リクエスト処理

## まとめ

### 動作確認済み

- ✅ API ルーティングが正常に機能
- ✅ Firebase Admin SDK との連携が正常
- ✅ エラーハンドリングが統一形式で動作
- ✅ 認証チェックが正常に機能
- ✅ データ取得が正常に機能

### 今後のテストが必要

- 🔄 ハードウェア認証 API の動作確認
- 🔄 ユーザー認証 API の動作確認
- 🔄 トランザクション処理の確認
- 🔄 エラーケースの網羅的テスト
- 🔄 パフォーマンステスト

## 結論

基本的な API エンドポイントは正常に動作しており、エラーハンドリングも適切に実装されています。次のステップとして、認証が必要なエンドポイントのテストと、実際のハードウェア連携テストが必要です。


