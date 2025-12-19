# 部室王 - 組み込み GUI + ハードウェア連携システム

Vue と FastAPI を使った、NFC カードリーダー連携アプリケーション

## システム構成

```
rasp-app/
├── src/              # Vueフロントエンド
│   ├── App.vue       # メインアプリケーション
│   ├── main.js
│   └── *.mp3         # 音声ファイル
├── backend/          # FastAPIバックエンド
│   ├── main.py       # WebSocketサーバー
│   ├── requirements.txt
│   └── .env          # 環境変数設定
└── package.json
```

## セットアップ手順

### 1. フロントエンド (Vue)

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:5173` にアクセス

### 2. バックエンド (FastAPI)

```bash
# バックエンドディレクトリに移動
cd backend

# Python仮想環境作成（推奨）
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# または
.\venv\Scripts\activate  # Windows

# 依存関係インストール
pip install -r requirements.txt

# 環境変数設定
cp .env.example .env
# .envファイルを編集してAPI_ENDPOINTとAPI_KEYを設定

# サーバー起動
python main.py
```

FastAPI サーバーが `http://localhost:8000` で起動します

## 機能

### 1. ログイン機能

- **LOGIN ボタン** → NFC カード待機画面
- NFC カードをかざすと WebSocket 経由でログイン処理
- ログインボーナス付与結果を表示
- 自動的にホーム画面に戻る

### 2. レース機能

- **RACE ボタン** → レース画面
- カウントダウン（timer.mp3 再生）
- レース実行（music.mp3 再生）
- 結果表示（順位とポイント）

### 3. 登録機能

- **登録ボタン** → NFC カード登録待機画面
- （カード登録機能は別途実装が必要）

### 4. 設定機能

- 各種設定（未実装）

## API 仕様

### WebSocket エンドポイント

`ws://localhost:8000/ws/nfc`

#### サーバー → クライアント

**接続確認**

```json
{
  "type": "connected",
  "message": "NFCリーダー待機中",
  "timestamp": "2025-12-19T10:00:00"
}
```

**カード検出**

```json
{
  "type": "card_detected",
  "cardId": "0a1b2c3d",
  "timestamp": "2025-12-19T10:00:00"
}
```

**ログイン結果（成功）**

```json
{
  "type": "login_result",
  "success": true,
  "data": {
    "user": {
      "displayName": "山田太郎",
      "totalPoints": 1500
    },
    "bonus": {
      "awarded": true,
      "points": 100
    },
    "checkIn": {
      "checkInTime": "2025-12-19T10:00:00"
    }
  }
}
```

**ログイン結果（エラー）**

```json
{
  "type": "login_result",
  "success": false,
  "error": "カードが登録されていません",
  "code": "BAD_REQUEST"
}
```

## トラブルシューティング

### NFC リーダーが認識されない

```bash
# デバイス確認
lsusb

# NFCpy診断
python3 -m nfc

# 権限設定（必要に応じて）
sudo chmod 666 /dev/bus/usb/XXX/YYY
```

### WebSocket 接続できない

1. FastAPI サーバーが起動しているか確認: `http://localhost:8000`
2. CORS エラーの場合: `backend/main.py`の`allow_origins`を確認
3. ポート 8000 が使用中: 別のポートに変更

### 音声が再生されない

- ブラウザの自動再生ポリシーにより、ユーザー操作が必要な場合があります
- 音声ファイル（timer.mp3, music.mp3）が`src/`ディレクトリに存在するか確認

## 開発

### ビルド

```bash
npm run build
```

### プレビュー

```bash
npm run preview
```

## 技術スタック

- **フロントエンド**: Vue 3, Vite, Tailwind CSS
- **バックエンド**: FastAPI, WebSocket, nfcpy
- **通信**: WebSocket（リアルタイム通信）
- **ハードウェア**: NFC カードリーダー（USB 接続）

## ライセンス

MIT
