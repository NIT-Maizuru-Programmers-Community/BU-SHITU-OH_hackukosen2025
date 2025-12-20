# Firebase 設定ガイド

レース結果を Firestore に保存するための設定方法です。

## 方法 1: Firebase Admin SDK（推奨）

Firebase に直接書き込むため、最も確実な方法です。

### 1. サービスアカウントキーの取得

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト `hacku2025-99da7` を選択
3. 設定（歯車アイコン）→ プロジェクトの設定 → サービスアカウント
4. 「新しい秘密鍵の生成」をクリック
5. JSON ファイルがダウンロードされます

### 2. 環境変数の設定

ダウンロードした JSON ファイルから以下の値を`.env`ファイルに設定します：

```bash
# backend/.env ファイルを作成
cd backend
cp .env.example .env
```

`.env`ファイルに以下を追加：

```env
# API設定
API_ENDPOINT=https://hacku2025.vercel.app/
API_KEY=Procon2025

# Firebase Admin SDK認証情報
FIREBASE_PRIVATE_KEY_ID=ダウンロードしたJSONの"private_key_id"の値
FIREBASE_PRIVATE_KEY="ダウンロードしたJSONの"private_key"の値（改行含む）"
FIREBASE_CLIENT_EMAIL=ダウンロードしたJSONの"client_email"の値
FIREBASE_CLIENT_ID=ダウンロードしたJSONの"client_id"の値
FIREBASE_CERT_URL=ダウンロードしたJSONの"client_x509_cert_url"の値
```

**注意**: `FIREBASE_PRIVATE_KEY`は改行を含むので、ダブルクォートで囲んでください。

### 3. パッケージのインストール

```bash
cd backend
uv add firebase-admin
```

### 4. バックエンドの再起動

```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

起動時に「✓ Firebase Admin SDK 初期化成功」と表示されれば成功です。

---

## 方法 2: Web API 経由（フォールバック）

Firebase Admin SDK の設定をしない場合、自動的に Web API 経由で送信されます。
ただし、外部 API に `/api/races` エンドポイントが実装されている必要があります。

この場合、`.env`ファイルには以下のみ設定：

```env
API_ENDPOINT=https://hacku2025.vercel.app/
API_KEY=Procon2025
```

---

## 動作確認

レース実行後、以下で確認できます：

1. **バックエンドのログ**:

   ```
   ✓ レース結果をFirestoreに保存: [ドキュメントID]
   ```

2. **Firebase Console**:

   - [Firebase Console](https://console.firebase.google.com/)
   - Firestore Database → `races` コレクション
   - 新しいドキュメントが作成されているか確認

3. **保存されるデータ例**:
   ```json
   {
     "date": "2025-12-20",
     "status": "completed",
     "winnerCharacterId": "fire",
     "winnerName": "ファイヤー",
     "winnerEmoji": "🔥",
     "characters": [
       {
         "characterId": "fire",
         "name": "ファイヤー",
         "emoji": "🔥",
         "rank": 1
       },
       ...
     ],
     "createdAt": "Timestamp",
     "updatedAt": "Timestamp"
   }
   ```

---

## トラブルシューティング

### エラー: "Firebase 初期化エラー"

- サービスアカウントキーの JSON 値が正しいか確認
- `.env`ファイルの場所が正しいか確認（`backend/.env`）
- 秘密鍵（FIREBASE_PRIVATE_KEY）がダブルクォートで囲まれているか確認

### データが保存されない

- バックエンドのログを確認
- Firestore のセキュリティルールを確認
- サービスアカウントに書き込み権限があるか確認

### "Web API 経由で送信します"と表示される

- Firebase Admin SDK の認証情報が設定されていません
- 外部 API の `/api/races` エンドポイントが実装されているか確認
