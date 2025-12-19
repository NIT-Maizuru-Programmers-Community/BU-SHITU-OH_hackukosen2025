"""
部室王 - 設定ファイルテンプレート
すべてのAPIキーと設定をここで管理

使用方法:
  このファイルを config.py にコピーして値を設定してください
  cp config.example.py config.py
"""

import os
from dotenv import load_dotenv

# 環境変数読み込み
load_dotenv()

# ===========================================
# Firebase設定
# ===========================================
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', 'your-firebase-project-id')
FIREBASE_API_KEY = os.getenv('FIREBASE_API_KEY', 'your-firebase-api-key')
FIREBASE_REST_URL = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents"

# ===========================================
# 外部API設定
# ===========================================
API_ENDPOINT = os.getenv('API_ENDPOINT', 'https://your-api-endpoint.com').rstrip('/')
API_KEY = os.getenv('API_KEY', 'your-api-key')

# ===========================================
# サーバー設定
# ===========================================
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 8000))

# ===========================================
# デバッグ出力
# ===========================================
def print_config():
    """設定情報をログに出力"""
    print("=== Configuration ===")
    print(f"Firebase Project ID: {FIREBASE_PROJECT_ID}")
    print(f"Firebase API Key configured: {'Yes' if FIREBASE_API_KEY else 'No'}")
    print(f"API Endpoint: {API_ENDPOINT}")
    print(f"API Key configured: {'Yes' if API_KEY else 'No'}")
    print(f"Server: {HOST}:{PORT}")
    print("====================")
