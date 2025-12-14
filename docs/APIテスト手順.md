# API テスト手順

## 事前準備

### 1. 環境変数の確認

`.env.local` ファイルが存在し、以下の環境変数が設定されているか確認してください：

```bash
# 必須の環境変数
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
HARDWARE_API_KEY=
```

設定方法の詳細は `docs/環境変数設定手順.md` を参照してください。

### 2. 開発サーバーの起動

```bash
npm run dev
```

サーバーが `http://localhost:3000` で起動することを確認してください。

## テスト方法

### A. cURL を使ったテスト（コマンドライン）

#### 1. ランキング取得（認証不要）

最もシンプルなエンドポイントから開始します：

```bash
curl http://localhost:3000/api/ranking
```

**期待される結果**:

```json
{
	"success": true,
	"ranking": [],
	"total": 0,
	"updatedAt": "2025-12-12T..."
}
```

#### 2. 在室者一覧取得（認証不要）

```bash
curl http://localhost:3000/api/attendance/current
```

**期待される結果**:

```json
{
	"success": true,
	"members": [],
	"total": 0
}
```

#### 3. NFC カード登録（ハードウェア認証）

**注意**: `YOUR_HARDWARE_API_KEY` を `.env.local` の `HARDWARE_API_KEY` に置き換えてください。

```bash
curl -X POST http://localhost:3000/api/auth/register-nfc \
  -H "X-API-Key: YOUR_HARDWARE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "nfcCardId": "TEST_CARD_001",
    "userId": "test_user_123"
  }'
```

**期待される結果**:

- 成功: ユーザーが存在する場合、NFC カードが登録される
- エラー: ユーザーが存在しない場合、"ユーザーが見つかりません"

#### 4. 本日のレース情報取得

```bash
curl http://localhost:3000/api/race/today
```

**期待される結果**:

```json
{
	"success": true,
	"race": null,
	"message": "本日のレースはまだ作成されていません"
}
```

### B. テストスクリプトの作成

より便利なテストのために、シェルスクリプトを作成します：

```bash
# scripts/test-api.sh を作成
```

### C. Postman を使ったテスト（推奨）

#### Postman のインストール

https://www.postman.com/downloads/ からダウンロードしてインストールします。

#### コレクションの作成

1. Postman を起動
2. 新しいコレクション「部室王 API」を作成
3. 環境変数を設定：
   - `base_url`: `http://localhost:3000`
   - `hardware_api_key`: `.env.local` の `HARDWARE_API_KEY` の値

#### リクエストの追加

各エンドポイントをコレクションに追加します。

## 段階的なテスト手順

### ステップ 1: 認証不要のエンドポイントテスト

```bash
# ランキング
curl http://localhost:3000/api/ranking

# 在室者一覧
curl http://localhost:3000/api/attendance/current

# 本日のレース
curl http://localhost:3000/api/race/today
```

すべて `{"success": true, ...}` が返ってくれば OK です。

### ステップ 2: テストユーザーの作成

Firebase コンソールから手動でテストユーザーを作成します：

1. Firebase Console → Authentication → Users → Add user
2. Firestore にユーザードキュメントを作成：

```javascript
// Firestoreコンソールから手動で作成
// コレクション: users
// ドキュメントID: (Firebase AuthのUID)
{
  displayName: "テストユーザー",
  email: "test@example.com",
  points: 100,
  isPresent: false,
  hasReceivedDailyBonus: false,
  createdAt: (現在のタイムスタンプ),
  updatedAt: (現在のタイムスタンプ)
}
```

### ステップ 3: ハードウェア認証 API のテスト

テストユーザーの UID を使用してテストします：

```bash
# 環境変数を設定
export HARDWARE_API_KEY="your-api-key-here"
export TEST_USER_ID="firebase-auth-uid-here"

# NFCカード登録
curl -X POST http://localhost:3000/api/auth/register-nfc \
  -H "X-API-Key: $HARDWARE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"nfcCardId\": \"TEST_CARD_001\",
    \"userId\": \"$TEST_USER_ID\"
  }"

# NFCログイン
curl -X POST http://localhost:3000/api/auth/nfc-login \
  -H "X-API-Key: $HARDWARE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "nfcCardId": "TEST_CARD_001"
  }'

# ポイント付与
curl -X POST http://localhost:3000/api/points/award \
  -H "X-API-Key: $HARDWARE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$TEST_USER_ID\",
    \"amount\": 50,
    \"type\": \"manual\",
    \"description\": \"テストポイント付与\"
  }"

# チェックイン
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "X-API-Key: $HARDWARE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$TEST_USER_ID\"
  }"
```

### ステップ 4: ユーザー認証 API のテスト

Firebase Auth Token が必要です。以下の方法で取得します：

#### 方法 1: ブラウザのコンソールから取得

1. アプリにログイン
2. ブラウザの開発者ツールを開く
3. コンソールで以下を実行：

```javascript
const auth = getAuth();
const user = auth.currentUser;
if (user) {
	user.getIdToken().then((token) => {
		console.log(token);
	});
}
```

4. 表示されたトークンをコピー

#### 方法 2: テスト用のトークンを取得

```bash
# Firebase CLIでカスタムトークンを作成
firebase auth:export users.json
```

トークンを取得したら：

```bash
export FIREBASE_TOKEN="your-firebase-id-token"

# ログインボーナス取得
curl -X POST http://localhost:3000/api/auth/daily-bonus \
  -H "Authorization: Bearer $FIREBASE_TOKEN"

# ポイント残高確認
curl http://localhost:3000/api/points/balance?userId=$TEST_USER_ID \
  -H "Authorization: Bearer $FIREBASE_TOKEN"

# ポイント履歴
curl http://localhost:3000/api/points/history?userId=$TEST_USER_ID \
  -H "Authorization: Bearer $FIREBASE_TOKEN"

# 送金
curl -X POST http://localhost:3000/api/transfer/send \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "他のユーザーのUID",
    "amount": 10,
    "message": "テスト送金"
  }'
```

### ステップ 5: エラーケースのテスト

正常系だけでなく、エラーケースもテストします：

```bash
# 無効なAPI Key
curl -X POST http://localhost:3000/api/auth/nfc-login \
  -H "X-API-Key: invalid-key" \
  -H "Content-Type: application/json" \
  -d '{"nfcCardId": "TEST"}'
# → {"success": false, "error": "無効なAPI Key"}

# 存在しないNFCカード
curl -X POST http://localhost:3000/api/auth/nfc-login \
  -H "X-API-Key: $HARDWARE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"nfcCardId": "NONEXISTENT"}'
# → {"success": false, "error": "このカードは登録されていません"}

# ポイント不足
curl -X POST http://localhost:3000/api/points/deduct \
  -H "X-API-Key: $HARDWARE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$TEST_USER_ID\",
    \"amount\": 99999,
    \"type\": \"race_bet\",
    \"description\": \"テスト\"
  }"
# → {"success": false, "error": "ポイントが不足しています"}
```

## テスト結果の確認

### Firestore でデータを確認

1. Firebase Console → Firestore Database
2. 以下のコレクションを確認：
   - `users` - ユーザー情報、ポイント残高
   - `pointTransactions` - ポイント履歴
   - `attendances` - 出席記録
   - `transfers` - 送金記録

### ログの確認

開発サーバーのターミナルでエラーログを確認：

```bash
# サーバーのログを確認
# エラーが発生した場合、詳細がターミナルに表示されます
```

## よくあるエラーと対処法

### エラー: "Firebase admin initialization error"

**原因**: 環境変数が正しく設定されていない

**対処法**:

1. `.env.local` ファイルを確認
2. `FIREBASE_ADMIN_PRIVATE_KEY` がダブルクォーテーションで囲まれているか確認
3. 開発サーバーを再起動

### エラー: "Invalid API Key"

**原因**: `HARDWARE_API_KEY` が一致していない

**対処法**:

1. `.env.local` の `HARDWARE_API_KEY` を確認
2. リクエストヘッダーの `X-API-Key` が正しいか確認
3. 開発サーバーを再起動

### エラー: "ユーザーが見つかりません"

**原因**: Firestore にユーザードキュメントが存在しない

**対処法**:

1. Firebase Console → Firestore
2. `users` コレクションにドキュメントを作成
3. ドキュメント ID は Firebase Auth の UID と一致させる

### エラー: 401 Unauthorized

**原因**: Firebase Auth Token が無効または期限切れ

**対処法**:

1. 新しいトークンを取得
2. トークンが正しくヘッダーに設定されているか確認
3. `Authorization: Bearer TOKEN` の形式を確認

## 自動テストの作成（オプション）

より高度なテストのために、Jest を使った自動テストを作成できます：

```bash
# テストライブラリのインストール
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest

# jest.config.js を作成
# テストファイルを作成
```

## まとめ

1. ✅ 環境変数を設定
2. ✅ 開発サーバーを起動
3. ✅ 認証不要のエンドポイントをテスト
4. ✅ テストユーザーを作成
5. ✅ ハードウェア認証 API をテスト
6. ✅ ユーザー認証 API をテスト
7. ✅ エラーケースをテスト
8. ✅ Firestore でデータを確認

すべてのテストが成功すれば、API は正常に動作しています！

