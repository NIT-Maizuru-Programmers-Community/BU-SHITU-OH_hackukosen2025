#!/usr/bin/env python3
"""
デイリーログインボーナス付与スクリプト
部室王 - ICカードタッチでログインボーナス

このスクリプトは、ICカードをタッチしたときに：
1. カードIDからユーザーを特定
2. ログインボーナスを付与
3. 結果を表示

使い方:
1. .env ファイルに以下を設定:
   API_ENDPOINT=https://your-app.vercel.app
   HARDWARE_API_KEY=your-hardware-api-key

2. スクリプトを実行:
   python3 daily_login_bonus.py
"""

import nfc
import requests
import time
import os
from datetime import datetime
from dotenv import load_dotenv

# 環境変数読み込み
load_dotenv()

# 設定
# API_ENDPOINT = os.getenv('API_ENDPOINT', 'https://hacku2025.vercel.app/')
# API_KEY = os.getenv('HARDWARE_API_KEY', '')

# 直接指定（じかで叩く）
API_ENDPOINT = 'https://hacku2025.vercel.app'
# ここにAPIキーを直接入力してください
API_KEY = 'YOUR_API_KEY_HERE'

POLL_INTERVAL = 1  # カード読み取りの間隔（秒）
CARD_COOLDOWN = 3  # 同じカードの連続タップ防止（秒）

# 最後にタップされたカードとタイムスタンプ
last_card_id = None
last_tap_time = 0


def grant_daily_bonus(card_id: str) -> dict:
    """
    APIにカードIDを送信してログインボーナスを付与
    
    Args:
        card_id: NFCカードのID（16進数文字列）
        
    Returns:
        API レスポンスデータ
    """
    try:
        response = requests.post(
            f'{API_ENDPOINT}/api/auth/nfc-login',
            json={
                'nfcCardId': card_id
            },
            headers={
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            timeout=10
        )
        
        if response.status_code == 200:
            response_data = response.json()
            # レスポンス形式: { success: true, message: "...", user: {...}, bonus: {...}, checkIn: {...} }
            # createSuccessResponse はデータをスプレッド展開するため、data フィールドでラップされていない
            return {
                'success': True,
                'data': response_data
            }
        
        elif response.status_code == 400:
            # カード未登録またはその他のエラー
            error_data = response.json()
            return {
                'success': False,
                'error': error_data.get('error', '不明なエラー'),
                'code': error_data.get('code', 'BAD_REQUEST')
            }
        
        elif response.status_code == 404:
            # カード未登録
            error_data = response.json()
            return {
                'success': False,
                'error': error_data.get('error', 'このカードは登録されていません'),
                'code': 'NOT_FOUND'
            }
        
        else:
            return {
                'success': False,
                'error': f'サーバーエラー (HTTP {response.status_code})',
                'code': 'SERVER_ERROR'
            }
            
    except requests.exceptions.Timeout:
        return {
            'success': False,
            'error': 'タイムアウト: サーバーに接続できません',
            'code': 'TIMEOUT'
        }
    except requests.exceptions.ConnectionError:
        return {
            'success': False,
            'error': '接続エラー: ネットワークを確認してください',
            'code': 'CONNECTION_ERROR'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'通信エラー: {str(e)}',
            'code': 'UNKNOWN_ERROR'
        }


def display_success(result_data: dict):
    """
    成功時の表示
    
    Args:
        result_data: APIからのレスポンスデータ
    """
    user = result_data.get('user', {})
    bonus = result_data.get('bonus', {})
    check_in = result_data.get('checkIn', {})
    
    print("\n" + "="*60)
    
    if bonus.get('awarded'):
        print("  ログインボーナスを受け取りました!")
        print("="*60)
        print(f"ユーザー名: {user.get('displayName', '不明')}")
        print(f"獲得ポイント: +{bonus.get('points', 0)} pt")
        print(f"総ポイント: {user.get('totalPoints', 0)} pt")
    else:
        print("  ようこそ!")
        print("="*60)
        print(f"ユーザー名: {user.get('displayName', '不明')}")
        print(f"総ポイント: {user.get('totalPoints', 0)} pt")
        print(f"\n{bonus.get('message', '')}")
    
    print(f"\n入室時刻: {check_in.get('checkInTime', '')}")
    print("="*60 + "\n")


def display_error(error_message: str, error_code: str):
    """
    エラー時の表示
    
    Args:
        error_message: エラーメッセージ
        error_code: エラーコード
    """
    print("\n" + "="*60)
    
    if error_code == 'DAILY_BONUS_CLAIMED':
        print("  本日のログインボーナスは受け取り済みです")
        print("="*60)
        print("明日また来てください!")
    elif error_code == 'NOT_FOUND':
        print("  カードが登録されていません")
        print("="*60)
        print("先にカードを登録してください")
        print("（nfc_card_registration.py を実行）")
    elif error_code == 'UNAUTHORIZED':
        print("  認証エラー")
        print("="*60)
        print("APIキーが正しく設定されているか確認してください")
    else:
        print("  エラーが発生しました")
        print("="*60)
        print(f"エラーコード: {error_code}")
        print(f"詳細: {error_message}")
    
    print("="*60 + "\n")


def on_connect(tag):
    """
    NFC カードがタッチされた時の処理
    """
    global last_card_id, last_tap_time
    
    current_time = time.time()
    
    # カード ID を取得
    card_id = tag.identifier.hex()
    
    # 連続タップ防止
    if card_id == last_card_id and (current_time - last_tap_time) < CARD_COOLDOWN:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 同じカードの連続タップを無視")
        while tag.is_present:
            time.sleep(0.1)
        return True
    
    last_card_id = card_id
    last_tap_time = current_time
    
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] カード検出!")
    print(f"カード ID: {card_id}")
    
    # ログインボーナスを付与
    print("ログインボーナスを確認中...")
    result = grant_daily_bonus(card_id)
    
    if result['success']:
        display_success(result['data'])
    else:
        display_error(result['error'], result['code'])
    
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
    print("  部室王 - デイリーログインボーナス")
    print("="*60)
    print(f"API エンドポイント: {API_ENDPOINT}")
    
    # API キーのチェック
    if not API_KEY:
        print("\n警告: HARDWARE_API_KEY が設定されていません")
        print(".env ファイルに HARDWARE_API_KEY を設定してください\n")
    
    print("\nICカードをかざしてください...\n")
    
    # NFC リーダーに接続
    try:
        clf = nfc.ContactlessFrontend('usb')
    except Exception as e:
        print(f"エラー: NFCリーダーに接続できません")
        print(f"詳細: {e}\n")
        print("トラブルシューティング:")
        print("  1. NFCリーダーがUSBで接続されているか確認")
        print("  2. 'lsusb' コマンドでデバイスが認識されているか確認")
        print("  3. 'python3 -m nfc' で診断を実行")
        print("  4. sudo 権限が必要な場合があります")
        return
    
    print("NFCリーダー接続成功\n")
    
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
        print("NFCリーダーを切断しました")


if __name__ == '__main__':
    main()
