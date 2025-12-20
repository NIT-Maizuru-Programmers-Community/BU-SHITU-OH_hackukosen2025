# 部室王 Hardware API Backend

FastAPI ベースのハードウェア連携サーバー

## セットアップ

### 1. 依存関係のインストール

```bash
cd backend
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env` ファイルを作成（`.env.example`を参考に）：

```env
API_ENDPOINT=https://hacku2025.vercel.app/
API_KEY=your-hardware-api-key
```

### 3. サーバーの起動

```bash
python main.py
```

または

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## エンドポイント

### WebSocket

- `ws://localhost:8000/ws/nfc` - NFC カード読み取りのリアルタイム通信

### REST API

- `GET /` - ヘルスチェック
- `POST /api/start-nfc-listening` - NFC リスニング開始
- `POST /api/stop-nfc-listening` - NFC リスニング停止

## WebSocket メッセージフォーマット

### サーバー → クライアント

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

**ログイン結果**

```json
{
  "type": "login_result",
  "success": true,
  "data": {
    "user": {...},
    "bonus": {...},
    "checkIn": {...}
  }
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
