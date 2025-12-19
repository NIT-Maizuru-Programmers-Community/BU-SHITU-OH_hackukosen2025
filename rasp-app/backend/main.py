#!/usr/bin/env python3
"""
部室王 - ハードウェア連携 FastAPI サーバー
NFCカード読み取りとVueアプリの連携
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import nfc
import asyncio
import threading
import time
from datetime import datetime
import requests
import os
from dotenv import load_dotenv
from typing import Optional, Dict, List
import json

# 環境変数読み込み
load_dotenv()

# 設定
API_ENDPOINT = os.getenv('API_ENDPOINT', 'https://hacku2025.vercel.app/')
API_KEY = os.getenv('API_KEY', '')

app = FastAPI(title="部室王 Hardware API")

# CORS設定（Viteの開発サーバーからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# グローバル状態管理
nfc_reader = None
websocket_connections: List[WebSocket] = []
nfc_listening = False
nfc_mode = 'login'  # 'login' or 'register'
last_card_id = None
last_tap_time = 0
CARD_COOLDOWN = 3


class LoginResponse(BaseModel):
    """ログインレスポンス"""
    success: bool
    data: Optional[Dict] = None
    error: Optional[str] = None
    code: Optional[str] = None


class NFCCardData(BaseModel):
    """NFCカードデータ"""
    cardId: str
    timestamp: str


def grant_daily_bonus(card_id: str) -> dict:
    """
    APIにカードIDを送信してログインボーナスを付与
    """
    try:
        response = requests.post(
            f'{API_ENDPOINT}/api/auth/nfc-login',
            json={'nfcCardId': card_id},
            headers={
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            timeout=10
        )
        
        if response.status_code == 200:
            return {'success': True, 'data': response.json()}
        elif response.status_code == 400:
            error_data = response.json()
            return {
                'success': False,
                'error': error_data.get('message', '不明なエラー'),
                'code': 'BAD_REQUEST'
            }
        elif response.status_code == 409:
            return {
                'success': False,
                'error': '本日のログインボーナスは既に受け取り済みです',
                'code': 'ALREADY_CLAIMED'
            }
        else:
            return {
                'success': False,
                'error': f'サーバーエラー (HTTP {response.status_code})',
                'code': 'SERVER_ERROR'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'通信エラー: {str(e)}',
            'code': 'UNKNOWN_ERROR'
        }


def register_card(card_id: str) -> dict:
    """
    APIにカードを登録してトークンを取得
    """
    try:
        response = requests.post(
            f'{API_ENDPOINT}/api/auth/register-card',
            json={'nfcCardId': card_id},
            headers={
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
                'User-Agent': 'Mozilla/5.0'
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ カード登録成功")
            print(f"  登録ID: {data['data']['registrationId']}")
            return {'success': True, 'data': data['data']}
        elif response.status_code == 409:
            return {
                'success': False,
                'error': 'このカードは既に登録されています',
                'code': 'ALREADY_REGISTERED'
            }
        else:
            return {
                'success': False,
                'error': f'サーバーエラー (HTTP {response.status_code})',
                'code': 'SERVER_ERROR'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'通信エラー: {str(e)}',
            'code': 'UNKNOWN_ERROR'
        }


async def broadcast_to_clients(message: dict):
    """全接続クライアントにメッセージを送信"""
    disconnected = []
    for ws in websocket_connections:
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.append(ws)
    
    # 切断されたクライアントを削除
    for ws in disconnected:
        if ws in websocket_connections:
            websocket_connections.remove(ws)


def on_nfc_connect(tag):
    """NFCカードがタッチされた時の処理"""
    global last_card_id, last_tap_time, nfc_mode
    
    current_time = time.time()
    card_id = tag.identifier.hex()
    
    # 連続タップ防止
    if card_id == last_card_id and (current_time - last_tap_time) < CARD_COOLDOWN:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 同じカードの連続タップを無視")
        while tag.is_present:
            time.sleep(0.1)
        return True
    
    last_card_id = card_id
    last_tap_time = current_time
    
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] カード検出: {card_id} (モード: {nfc_mode})")
    
    # WebSocketで検出を通知
    asyncio.run(broadcast_to_clients({
        'type': 'card_detected',
        'cardId': card_id,
        'timestamp': datetime.now().isoformat(),
        'mode': nfc_mode
    }))
    
    if nfc_mode == 'login':
        # ログインボーナスを付与
        result = grant_daily_bonus(card_id)
        
        # 結果を送信
        asyncio.run(broadcast_to_clients({
            'type': 'login_result',
            'success': result['success'],
            'data': result.get('data'),
            'error': result.get('error'),
            'code': result.get('code')
        }))
    
    elif nfc_mode == 'register':
        # カード登録
        result = register_card(card_id)
        
        # 結果を送信
        asyncio.run(broadcast_to_clients({
            'type': 'register_result',
            'success': result['success'],
            'data': result.get('data'),
            'error': result.get('error'),
            'code': result.get('code')
        }))
    
    # カードが離れるまで待機
    while tag.is_present:
        time.sleep(0.1)
    
    return True
    while tag.is_present:
        time.sleep(0.1)
    
    return True


def nfc_reader_loop():
    """NFCカードリーダーのメインループ（別スレッドで実行）"""
    global nfc_reader, nfc_listening
    
    try:
        nfc_reader = nfc.ContactlessFrontend('usb')
        print("NFCリーダー接続成功")
        
        while nfc_listening:
            try:
                nfc_reader.connect(rdwr={
                    'on-connect': on_nfc_connect,
                    'beep-on-connect': False
                })
                time.sleep(0.5)
            except Exception as e:
                print(f"NFCリーダーエラー: {e}")
                time.sleep(1)
                
    except Exception as e:
        print(f"NFCリーダー初期化エラー: {e}")
        nfc_listening = False


@app.on_event("startup")
async def startup_event():
    """サーバー起動時の処理"""
    global nfc_listening
    
    print("="*60)
    print("  部室王 Hardware API Server")
    print("="*60)
    print(f"API エンドポイント: {API_ENDPOINT}")
    
    if not API_KEY:
        print("\n警告: API_KEY が設定されていません")
    
    # NFCリーダーを別スレッドで起動
    nfc_listening = True
    nfc_thread = threading.Thread(target=nfc_reader_loop, daemon=True)
    nfc_thread.start()


@app.on_event("shutdown")
async def shutdown_event():
    """サーバー停止時の処理"""
    global nfc_listening, nfc_reader
    
    nfc_listening = False
    if nfc_reader:
        nfc_reader.close()
    print("NFCリーダーを切断しました")


@app.get("/")
async def root():
    """ヘルスチェック"""
    return {
        "status": "ok",
        "service": "部室王 Hardware API",
        "nfc_listening": nfc_listening,
        "connected_clients": len(websocket_connections)
    }


@app.websocket("/ws/nfc")
async def websocket_nfc(websocket: WebSocket):
    """NFCカード読み取り用WebSocket"""
    await websocket.accept()
    websocket_connections.append(websocket)
    
    print(f"WebSocketクライアント接続 (合計: {len(websocket_connections)})")
    
    try:
        # 接続確認メッセージ
        await websocket.send_json({
            'type': 'connected',
            'message': 'NFCリーダー待機中',
            'timestamp': datetime.now().isoformat()
        })
        
        # クライアントからのメッセージを待機
        while True:
            data = await websocket.receive_text()
            # クライアントからのping等を処理
            if data == "ping":
                await websocket.send_json({'type': 'pong'})
                
    except WebSocketDisconnect:
        print("WebSocketクライアント切断")
    finally:
        if websocket in websocket_connections:
            websocket_connections.remove(websocket)


@app.post("/api/start-nfc-listening")
async def start_nfc_listening():
    """NFCリスニング開始（手動開始が必要な場合）"""
    global nfc_listening
    
    if not nfc_listening:
        nfc_listening = True
        nfc_thread = threading.Thread(target=nfc_reader_loop, daemon=True)
        nfc_thread.start()
        return {"status": "started"}
    
    return {"status": "already_running"}


@app.post("/api/stop-nfc-listening")
async def stop_nfc_listening():
    """NFCリスニング停止"""
    global nfc_listening
    nfc_listening = False
    return {"status": "stopped"}


@app.post("/api/set-nfc-mode")
async def set_nfc_mode(mode: str):
    """
    NFCモードを設定
    mode: 'login' または 'register'
    """
    global nfc_mode
    
    if mode not in ['login', 'register']:
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'login' or 'register'.")
    
    nfc_mode = mode
    print(f"NFCモードを '{mode}' に変更しました")
    
    # 全クライアントに通知
    await broadcast_to_clients({
        'type': 'mode_changed',
        'mode': mode
    })
    
    return {"status": "ok", "mode": mode}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
