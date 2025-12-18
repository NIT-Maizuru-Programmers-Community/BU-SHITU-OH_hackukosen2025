#!/usr/bin/env python3
"""
NFC カード登録スクリプト
部室王 - ICカード登録システム

このスクリプトは、ICカードをタッチしたときに：
1. APIでカード登録トークンを生成
2. QRコードを画面に表示
3. ユーザーがQRコードをスキャンしてアカウントと連携
"""

import nfc
import requests
import time
import os
import qrcode
from dotenv import load_dotenv
from datetime import datetime

# 環境変数読み込み
load_dotenv()

# 設定
# API_ENDPOINT = os.getenv('API_ENDPOINT', 'https://hacku2025.vercel.app/')
# API_KEY = os.getenv('API_KEY', '')

# 直接指定（じかで叩く）
API_ENDPOINT = 'https://hacku2025.vercel.app'
# ここにAPIキーを直接入力してください
API_KEY = 'YOUR_API_KEY_HERE'

POLL_INTERVAL = 1  # カード読み取りの間隔（秒）


def generate_qr_code(url: str, filename: str = "card_link_qr.png") -> str:
    """
    QRコードを生成して画像ファイルとして保存
    
    Args:
        url: QRコードに埋め込むURL
        filename: 保存するファイル名
        
    Returns:
        保存したファイルのパス
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filename)
    
    return filename


def display_qr_code(filename: str):
    """
    QRコードを表示する（環境に応じて実装を変更）
    
    Args:
        filename: 表示する画像ファイル名
    """
    # オプション1: 画像ビューアーで開く（Linux/macOS）
    try:
        if os.name == 'posix':  # Linux/macOS
            os.system(f'open {filename}' if os.uname().sysname == 'Darwin' else f'xdg-open {filename}')
        elif os.name == 'nt':  # Windows
            os.system(f'start {filename}')
    except Exception as e:
        print(f"QRコードの表示に失敗: {e}")
        print(f"手動で {filename} を開いてください")
    
    # オプション2: ターミナルにASCIIアートとして表示
    # （qrcode[pil] パッケージが必要）
    try:
        import sys
        qr = qrcode.QRCode()
        qr.add_data(open(filename, 'rb').read())
        qr.print_ascii(out=sys.stdout, invert=True)
    except:
        pass


def register_card(card_id: str) -> dict:
    """
    APIにカードを登録してトークンを取得
    
    Args:
        card_id: NFCカードのID（16進数文字列）
        
    Returns:
        API レスポンスデータ
    """
    try:
        response = requests.post(
            f'{API_ENDPOINT}/api/auth/register-card',
            json={
                'nfcCardId': card_id
            },
            headers={
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout=10
        )
        
        print(f"DEBUG: Endpoint: {API_ENDPOINT}/api/auth/register-card")
        print(f"DEBUG: Status Code: {response.status_code}")
        print(f"DEBUG: Content-Type: {response.headers.get('Content-Type')}")
        print(f"DEBUG: Response Text (First 200 chars): {response.text[:200]}")


        if response.status_code == 200:
            try:
                response_data = response.json()
                print(f"✓ カード登録成功")
                
                # レスポンス形式: { success: true, message: "...", data: {...} }
                if 'data' in response_data:
                    data = response_data['data']
                    print(f"  登録ID: {data['registrationId']}")
                    print(f"  有効期限: {data['expiresIn']}秒")
                    return data
                else:
                    print(f"✗ レスポンス形式エラー: 'data' フィールドがありません")
                    print(f"  レスポンス内容: {response.text}")
                    return None
            except ValueError as e:
                print(f"✗ JSONデコードエラー: {e}")
                print(f"  レスポンス内容: {response.text}")
                return None
        
        elif response.status_code == 409:
            print("✗ このカードは既に登録されています")
            return None
        
        else:
            print(f"✗ エラー: {response.status_code}")
            print(response.text)
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"✗ 通信エラー: {e}")
        return None


def on_connect(tag):
    """
    NFC カードがタッチされた時の処理
    """
    print(f"\n[{datetime.now()}] カード検出!")
    
    # カード ID を取得
    card_id = tag.identifier.hex()
    print(f"カード ID: {card_id}")
    
    # API でカードを登録
    registration_data = register_card(card_id)
    
    if registration_data:
        link_url = registration_data['linkUrl']
        
        print("\n" + "="*60)
        print("  QRコードをスキャンしてアカウントと連携してください")
        print("="*60)
        print(f"\nURL: {link_url}\n")
        
        # QRコードを生成
        qr_filename = f"qr_{registration_data['registrationId']}.png"
        generate_qr_code(link_url, qr_filename)
        
        # QRコードを表示
        display_qr_code(qr_filename)
        
        print("\n連携が完了するまで待機中...")
        print("（Ctrl+C で中断してカードを外してください）")
        
        # 連携完了を待つ（30分間）
        start_time = time.time()
        expires_in = registration_data['expiresIn']
        
        while time.time() - start_time < expires_in:
            # カードが外れたらループ終了
            if not tag.is_present:
                print("\nカードが離れました")
                break
            
            time.sleep(1)
            
            # 残り時間を表示（10秒ごと）
            elapsed = int(time.time() - start_time)
            if elapsed % 10 == 0:
                remaining = expires_in - elapsed
                print(f"  残り時間: {remaining // 60}分{remaining % 60}秒")
        
        # QRコードファイルを削除
        try:
            os.remove(qr_filename)
        except:
            pass
    
    # カードが離れるまで待機
    while tag.is_present:
        time.sleep(0.1)
    
    print("次のカードをお待ちしています...\n")
    return True


def main():
    """
    メイン処理
    """
    print("="*60)
    print("  ☆ 部室王 ☆ ICカード登録システム")
    print("="*60)
    print(f"API エンドポイント: {API_ENDPOINT}")
    print("\n新しいICカードをかざしてください...\n")
    
    # NFC リーダーに接続
    try:
        clf = nfc.ContactlessFrontend('usb')
    except Exception as e:
        print(f"✗ NFCリーダーに接続できません: {e}")
        print("\nトラブルシューティング:")
        print("  1. NFCリーダーがUSBで接続されているか確認")
        print("  2. 'lsusb' コマンドでデバイスが認識されているか確認")
        print("  3. 'python3 -m nfc' で診断を実行")
        return
    
    try:
        while True:
            # カードの読み取りを待機
            clf.connect(rdwr={
                'on-connect': on_connect,
                'beep-on-connect': False
            })
            time.sleep(POLL_INTERVAL)
    
    except KeyboardInterrupt:
        print("\n\n終了します...")
    finally:
        clf.close()


if __name__ == '__main__':
    main()

