#!/usr/bin/env python3
"""
NFC ログイン API テストスクリプト
"""

import requests
import json

# 設定
API_ENDPOINT = 'https://hacku2025.vercel.app'
API_KEY = 'YOUR_API_KEY_HERE'  # ここにAPIキーを入力

# テスト用のカードID
TEST_CARD_ID = 'test123456'  # 実際に登録済みのカードIDに変更してください

def test_nfc_login():
    """NFC ログイン API をテスト"""
    print("="*60)
    print("  NFC ログイン API テスト")
    print("="*60)
    print(f"エンドポイント: {API_ENDPOINT}/api/auth/nfc-login")
    print(f"カードID: {TEST_CARD_ID}\n")
    
    try:
        response = requests.post(
            f'{API_ENDPOINT}/api/auth/nfc-login',
            json={
                'nfcCardId': TEST_CARD_ID
            },
            headers={
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            timeout=10
        )
        
        print(f"ステータスコード: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}\n")
        
        if response.status_code == 200:
            data = response.json()
            print("✓ 成功!")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        elif response.status_code == 404:
            print("✗ 404 Not Found")
            print("エンドポイントが見つかりません")
            print("\n考えられる原因:")
            print("  1. デプロイされたバージョンにエンドポイントが含まれていない")
            print("  2. URLが間違っている")
            print(f"\nレスポンス: {response.text}")
        elif response.status_code == 401:
            print("✗ 401 Unauthorized")
            print("APIキーが間違っているか設定されていません")
            print(f"\nレスポンス: {response.text}")
        else:
            print(f"✗ エラー: {response.status_code}")
            print(f"レスポンス: {response.text}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"✗ 接続エラー: {e}")
        print("\nネットワークを確認してください")
    except requests.exceptions.Timeout:
        print("✗ タイムアウト")
        print("\nサーバーの応答が遅すぎます")
    except Exception as e:
        print(f"✗ エラー: {e}")

if __name__ == '__main__':
    test_nfc_login()
