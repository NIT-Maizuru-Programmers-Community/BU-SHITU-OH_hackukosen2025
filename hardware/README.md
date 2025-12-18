# ハードウェアスクリプト

☆ 部室王 ☆ の NFC ハードウェア用 Python スクリプトです。

---

## 📋 スクリプト一覧

| ファイル                   | 説明                   | 用途                 |
| -------------------------- | ---------------------- | -------------------- |
| `nfc_card_registration.py` | IC カード登録システム  | 新しいカードの登録   |
| `daily_login_bonus.py`     | ログインボーナス付与   | 日常的な入退室管理   |
| `auto_complete_race.py`    | レース自動締切システム | 毎日のレース結果確定 |

---

## 🚀 セットアップ手順

### 1. 必要なハードウェア

- **NFC リーダー**: RC-S380 (PaSoRi) または ACR122U
- **Raspberry Pi**: Raspberry Pi 4/5 推奨
- **ディスプレイ**: QR コード表示用（オプション）

### 2. Raspberry Pi のセットアップ

```bash
# システムを最新に更新
sudo apt update && sudo apt upgrade -y

# Python と pip のインストール
sudo apt install -y python3-pip python3-dev

# 必要なパッケージのインストール
pip3 install nfcpy requests python-dotenv qrcode[pil]
```

### 3. NFC リーダーの接続確認

```bash
# USBデバイスの確認
lsusb

# NFCリーダーの診断
python3 -m nfc
```

正常に認識されると以下のような出力が表示されます：

```
This is the 1.0.4 version of nfcpy run in Python 3.9.2
on Linux-5.10.103-v7l+-armv7l-with-debian-11.2
I'm now searching your system for contactless devices
** found usb:054c:06c3 at usb:001:004 - Sony RC-S380/P
```

### 4. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成します：

```bash
# Web アプリの URL
API_ENDPOINT=https://your-app.vercel.app

# ハードウェア用 API キー（Vercel の環境変数と同じ値を設定）
API_KEY=your-hardware-api-key-here
```

**重要**: `.env` ファイルは Git にコミットしないでください！

### 5. スクリプトの配置

```bash
# プロジェクトをクローン
git clone https://github.com/your-org/hacku2025.git
cd hacku2025/hardware

# 環境変数ファイルを作成
nano .env
# 上記の内容を入力

# 実行権限を付与
chmod +x nfc_card_registration.py
chmod +x nfc_reader.py
```

---

## 📱 IC カード登録モード

### 使い方

```bash
python3 nfc_card_registration.py
```

### フロー

1. スクリプトを起動
2. 新しい IC カードをかざす
3. QR コードが画面に表示される
4. ユーザーがスマホで QR コードをスキャン
5. アプリで「連携する」をタップ
6. 連携完了！

### QR コード表示方法のカスタマイズ

デフォルトでは、QR コードは画像ファイルとして保存され、システムの画像ビューアーで開かれます。

**ディスプレイに直接表示する場合**:

`display_qr_code()` 関数をカスタマイズしてください。

例: Raspberry Pi のディスプレイに全画面表示

```python
import tkinter as tk
from PIL import ImageTk

def display_qr_code(filename: str):
    """ディスプレイに全画面でQRコードを表示"""
    root = tk.Tk()
    root.attributes('-fullscreen', True)
    root.configure(background='white')

    img = Image.open(filename)
    img = img.resize((800, 800))  # サイズ調整
    photo = ImageTk.PhotoImage(img)

    label = tk.Label(root, image=photo, bg='white')
    label.pack(expand=True)

    # 30秒後に閉じる
    root.after(30000, root.destroy)

    root.mainloop()
```

---

## 🎁 デイリーログインボーナスモード

### 使い方

```bash
python3 daily_login_bonus.py
```

### フロー

1. スクリプトを起動
2. 登録済みの IC カードをかざす
3. 自動的にログインボーナスが付与される（1 日 1 回）
4. 獲得ポイントと連続ログイン日数が表示される

### 特徴

- **1 日 1 回限定**: 同じユーザーは 1 日 1 回のみボーナスを受け取れます
- **連続ログインボーナス**: 連続してログインすると追加ポイントがもらえます
- **連続タップ防止**: 同じカードを 3 秒以内に連続でタップしても 1 回のみカウント

### 表示例

**成功時**:

```
============================================================
  ログインボーナスを受け取りました!
============================================================
ユーザー名: 山田太郎
獲得ポイント: +10 pt
連続ログイン: 3日
総ポイント: 150 pt
============================================================
```

**既に受け取り済みの場合**:

```
============================================================
  本日のログインボーナスは受け取り済みです
============================================================
明日また来てください!
============================================================
```

**カード未登録の場合**:

```
============================================================
  カードが登録されていません
============================================================
先にカードを登録してください
（nfc_card_registration.py を実行）
============================================================
```

### 自動起動設定

システム起動時に自動実行するように設定します。

**systemd サービスファイルを作成**:

```bash
sudo nano /etc/systemd/system/nfc-daily-bonus.service
```

**内容**:

```ini
[Unit]
Description=Daily Login Bonus System for Bushitsuou
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/hacku2025/hardware
ExecStart=/usr/bin/python3 /home/pi/hacku2025/hardware/daily_login_bonus.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**サービスを有効化**:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nfc-daily-bonus.service
sudo systemctl start nfc-daily-bonus.service

# 状態確認
sudo systemctl status nfc-daily-bonus.service
```

**ログの確認**:

```bash
# リアルタイムでログを表示
sudo journalctl -u nfc-daily-bonus.service -f

# 最新100行を表示
sudo journalctl -u nfc-daily-bonus.service -n 100
```

---

## 🎲 レース自動締切モード

### 使い方

```bash
# 手動実行
python3 auto_complete_race.py

# cron で自動実行（毎日18:00）
0 18 * * * /usr/bin/python3 /home/pi/hacku2025/hardware/auto_complete_race.py >> /var/log/race_complete.log 2>&1
```

### フロー

1. 今日のレース情報を取得
2. 参加キャラクターをランダムにシャッフル
3. 1 位のキャラクターを勝者として決定
4. レース完了 API を呼び出し
5. 配当を自動計算・付与

**注意**: レースに参加するのはユーザーではなく、固定のキャラクター（ウサギ、カメ、チーターなど）です。

### 自動実行設定（cron）

毎日 18:00 に自動的にレースを締め切るように設定します。

```bash
# crontab を編集
crontab -e

# 以下の行を追加（毎日18:00に実行）
0 18 * * * /usr/bin/python3 /home/pi/hacku2025/hardware/auto_complete_race.py >> /var/log/race_complete.log 2>&1
```

**ログの確認**:

```bash
# ログファイルを確認
tail -f /var/log/race_complete.log

# 最新100行を表示
tail -n 100 /var/log/race_complete.log
```

---

## 🔧 トラブルシューティング

### NFC リーダーが認識されない

**確認事項**:

```bash
# USBデバイスを確認
lsusb

# カーネルモジュールを確認
lsmod | grep pn533

# dmesg でエラーを確認
dmesg | tail -n 50
```

**解決策**:

- USB ケーブルを差し直す
- 別の USB ポートに接続
- Raspberry Pi を再起動

### API 接続エラー

**確認事項**:

```bash
# インターネット接続を確認
ping google.com

# APIエンドポイントを確認
curl -I https://your-app.vercel.app

# 環境変数を確認
cat .env
```

**解決策**:

- `.env` ファイルの `API_ENDPOINT` を確認
- `API_KEY` が正しいか確認
- Vercel の環境変数 `HARDWARE_API_KEY` と一致しているか確認

### QR コードが表示されない

**解決策**:

1. 生成された `qr_*.png` ファイルを手動で開く
2. `display_qr_code()` 関数をカスタマイズ
3. ターミナルに ASCII アートとして表示するオプションを使用

---

## 🔒 セキュリティ

### API キーの管理

- **絶対にコミットしない**: `.env` ファイルを `.gitignore` に追加
- **定期的にローテーション**: API キーを定期的に変更
- **強力なキーを使用**: 最低 32 文字のランダム文字列

### ネットワークセキュリティ

- Raspberry Pi のファイアウォールを設定
- 不要なサービスを無効化
- SSH のパスワード認証を無効化（鍵認証のみ）

---

## 📊 運用

### ログの管理

ログファイルを保存する場合:

```python
import logging

logging.basicConfig(
    filename='/var/log/nfc_reader.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
```

### 定期メンテナンス

```bash
# ログのローテーション（週次）
sudo nano /etc/logrotate.d/nfc-reader

# 内容
/var/log/nfc_reader.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
```

---

## 📖 参考資料

- [nfcpy ドキュメント](https://nfcpy.readthedocs.io/)
- [Raspberry Pi 公式ドキュメント](https://www.raspberrypi.org/documentation/)
- [systemd サービスの作成方法](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

---

## 🆘 サポート

問題が発生した場合は、以下の情報を添えてお問い合わせください：

- Raspberry Pi のモデルと OS バージョン
- NFC リーダーのモデル
- エラーメッセージの全文
- `python3 -m nfc` の出力
- `sudo journalctl -u nfc-login.service -n 100` の出力
