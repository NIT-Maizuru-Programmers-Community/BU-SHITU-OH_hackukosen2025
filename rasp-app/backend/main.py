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
from typing import Optional, Dict, List
import json

# 設定ファイルから読み込み
from config import (
    FIREBASE_PROJECT_ID,
    FIREBASE_API_KEY,
    FIREBASE_REST_URL,
    API_ENDPOINT,
    API_KEY,
    print_config
)

# 設定情報を出力
print_config()


def convert_to_firestore_value(value):
    """
    Pythonの値をFirestore REST APIの形式に変換
    """
    if value is None:
        return {"nullValue": None}
    elif isinstance(value, bool):
        return {"booleanValue": value}
    elif isinstance(value, int):
        return {"integerValue": str(value)}
    elif isinstance(value, float):
        return {"doubleValue": value}
    elif isinstance(value, str):
        return {"stringValue": value}
    elif isinstance(value, list):
        return {"arrayValue": {"values": [convert_to_firestore_value(v) for v in value]}}
    elif isinstance(value, dict):
        return {"mapValue": {"fields": {k: convert_to_firestore_value(v) for k, v in value.items()}}}
    else:
        return {"stringValue": str(value)}


def write_to_firestore(collection: str, data: dict) -> dict:
    """
    Firestore REST APIを使用してドキュメントを作成
    """
    try:
        # Firestore形式に変換
        firestore_fields = {k: convert_to_firestore_value(v) for k, v in data.items()}
        
        payload = {
            "fields": firestore_fields
        }
        
        # Firestore REST APIにリクエスト
        url = f"{FIREBASE_REST_URL}/{collection}?key={FIREBASE_API_KEY}"
        
        response = requests.post(
            url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            # ドキュメントIDを抽出
            doc_id = result.get('name', '').split('/')[-1]
            return {'success': True, 'id': doc_id, 'data': result}
        else:
            return {
                'success': False,
                'error': f'Firestore APIエラー (HTTP {response.status_code})',
                'details': response.text
            }
    except Exception as e:
        import traceback
        return {
            'success': False,
            'error': f'Firestore書き込みエラー: {str(e)}',
            'traceback': traceback.format_exc()
        }


def update_firestore_document(collection: str, doc_id: str, data: dict) -> dict:
    """
    Firestore REST APIを使用してドキュメントを更新
    """
    try:
        # Firestore形式に変換
        firestore_fields = {k: convert_to_firestore_value(v) for k, v in data.items()}
        
        payload = {
            "fields": firestore_fields
        }
        
        # 更新するフィールドを指定
        update_mask = '&'.join([f'updateMask.fieldPaths={k}' for k in data.keys()])
        url = f"{FIREBASE_REST_URL}/{collection}/{doc_id}?key={FIREBASE_API_KEY}&{update_mask}"
        
        response = requests.patch(
            url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            return {'success': True, 'id': doc_id, 'data': result}
        else:
            return {
                'success': False,
                'error': f'Firestore更新エラー (HTTP {response.status_code})',
                'details': response.text
            }
    except Exception as e:
        import traceback
        return {
            'success': False,
            'error': f'Firestore更新エラー: {str(e)}',
            'traceback': traceback.format_exc()
        }


def query_firestore(collection: str, field: str, op: str, value) -> dict:
    """
    Firestore REST APIを使用してクエリを実行
    """
    try:
        # 構造化クエリ
        query_url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key={FIREBASE_API_KEY}"
        
        # 演算子のマッピング
        op_map = {
            '==': 'EQUAL',
            '!=': 'NOT_EQUAL',
            '<': 'LESS_THAN',
            '<=': 'LESS_THAN_OR_EQUAL',
            '>': 'GREATER_THAN',
            '>=': 'GREATER_THAN_OR_EQUAL'
        }
        
        query_payload = {
            "structuredQuery": {
                "from": [{"collectionId": collection}],
                "where": {
                    "fieldFilter": {
                        "field": {"fieldPath": field},
                        "op": op_map.get(op, 'EQUAL'),
                        "value": convert_to_firestore_value(value)
                    }
                },
                "limit": 10
            }
        }
        
        response = requests.post(
            query_url,
            json=query_payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            results = response.json()
            documents = []
            for item in results:
                if 'document' in item:
                    doc = item['document']
                    doc_id = doc.get('name', '').split('/')[-1]
                    documents.append({'id': doc_id, 'data': doc})
            return {'success': True, 'documents': documents}
        else:
            return {
                'success': False,
                'error': f'Firestoreクエリエラー (HTTP {response.status_code})',
                'details': response.text
            }
    except Exception as e:
        import traceback
        return {
            'success': False,
            'error': f'Firestoreクエリエラー: {str(e)}',
            'traceback': traceback.format_exc()
        }


# ベット情報管理（JSONファイル）
BETS_FILE_PATH = os.path.join(os.path.dirname(__file__), 'current_bets.json')


def load_bets() -> List[Dict]:
    """JSONファイルからベット情報を読み込む"""
    try:
        if os.path.exists(BETS_FILE_PATH):
            with open(BETS_FILE_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"ベット情報読み込みエラー: {e}")
        return []


def save_bets(bets: List[Dict]) -> bool:
    """JSONファイルにベット情報を保存"""
    try:
        with open(BETS_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(bets, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"ベット情報保存エラー: {e}")
        return False


def add_bet(bet_info: Dict) -> bool:
    """ベット情報を追加"""
    try:
        bets = load_bets()
        # 同じユーザーの既存のベットがあれば更新
        existing_idx = next((i for i, b in enumerate(bets) if b.get('userId') == bet_info.get('userId')), None)
        if existing_idx is not None:
            bets[existing_idx] = bet_info
            print(f"ベット更新: {bet_info.get('displayName')}")
        else:
            bets.append(bet_info)
            print(f"ベット追加: {bet_info.get('displayName')}")
        return save_bets(bets)
    except Exception as e:
        print(f"ベット追加エラー: {e}")
        return False


def clear_bets() -> bool:
    """ベット情報をクリア"""
    try:
        save_bets([])
        print("ベット情報をクリアしました")
        return True
    except Exception as e:
        print(f"ベットクリアエラー: {e}")
        return False


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


class RaceCharacter(BaseModel):
    """レースキャラクター情報"""
    characterId: str
    name: str
    emoji: str
    rank: int


class BetInfo(BaseModel):
    """ベット情報"""
    userId: str
    displayName: str
    selectedBet: str
    timestamp: str


class RaceResultData(BaseModel):
    """レース結果データ"""
    characters: List[RaceCharacter]
    bets: Optional[List[BetInfo]] = []


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
                'x-api-key': API_KEY
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
                'x-api-key': API_KEY,
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


def fetch_ranking_from_api(limit: int = 10) -> dict:
    """
    APIからランキングを取得
    """
    try:
        response = requests.get(
            f'{API_ENDPOINT}/api/ranking',
            params={'limit': limit},
            headers={
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            timeout=10
        )
        
        if response.status_code == 200:
            return {'success': True, 'data': response.json()}
        else:
            return {
                'success': False,
                'error': f'サーバーエラー (HTTP {response.status_code})'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'通信エラー: {str(e)}'
        }


def fetch_today_attendance_count() -> dict:
    """
    APIから今日のログイン人数を取得
    """
    try:
        print(f"\n=== 来室者数取得開始 ===")
        url = f'{API_ENDPOINT}/api/attendance/today-count'
        print(f"Request URL: {url}")
        print(f"Using API Key: {API_KEY[:10]}..." if len(API_KEY) > 10 else f"Using API Key: {API_KEY}")
        
        response = requests.get(
            url,
            headers={
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            timeout=10
        )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ 来室者数取得成功: {data}")
            return {'success': True, 'data': data}
        else:
            error_msg = f'サーバーエラー (HTTP {response.status_code})'
            print(f"✗ {error_msg}")
            print(f"Response: {response.text}")
            return {
                'success': False,
                'error': error_msg,
                'details': response.text
            }
            
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"\n✗ 来室者数取得エラー:")
        print(error_trace)
        return {
            'success': False,
            'error': f'通信エラー: {str(e)}',
            'traceback': error_trace
        }


# ポイント付与の基準値
POINTS_BY_RANK = {
    1: 100,  # 1位
    2: 50,   # 2位
    3: 10    # 3位
}


def award_points_to_user(user_id: str, amount: int, bet_type: str, description: str, related_id: str = None) -> dict:
    """
    ユーザーにポイントを付与する（Vercel API経由）
    
    Args:
        user_id: ユーザーID
        amount: 付与するポイント数
        bet_type: ポイントの種類（例: "race_bet"）
        description: 説明文
        related_id: 関連ID（レースIDなど）
    
    Returns:
        結果を含む辞書
    """
    try:
        print(f"\n=== ポイント付与開始 ===")
        print(f"User ID: {user_id}")
        print(f"Amount: {amount}")
        print(f"Type: {bet_type}")
        print(f"Description: {description}")
        
        url = f'{API_ENDPOINT}/api/points/award'
        
        payload = {
            'userId': user_id,
            'amount': amount,
            'type': bet_type,
            'description': description
        }
        
        if related_id:
            payload['relatedId'] = related_id
        
        response = requests.post(
            url,
            headers={
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            json=payload,
            timeout=10
        )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ ポイント付与成功: {data}")
            return {'success': True, 'data': data}
        else:
            error_msg = f'サーバーエラー (HTTP {response.status_code})'
            print(f"✗ {error_msg}")
            print(f"Response: {response.text}")
            return {
                'success': False,
                'error': error_msg,
                'details': response.text
            }
            
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"\n✗ ポイント付与エラー:")
        print(error_trace)
        return {
            'success': False,
            'error': f'通信エラー: {str(e)}',
            'traceback': error_trace
        }


def award_points_for_race(characters: List[Dict], bets: List[Dict], race_id: str = None) -> dict:
    """
    レース結果に基づいてベットしたユーザーにポイントを付与
    
    Args:
        characters: レース結果（キャラクターと順位）
        bets: ベット情報のリスト
        race_id: レースID（任意）
    
    Returns:
        結果を含む辞書
    """
    try:
        print(f"\n=== レースポイント付与開始 ===")
        
        if not bets:
            print("ベットがないためポイント付与をスキップ")
            return {'success': True, 'awarded': []}
        
        # キャラクター名から順位を取得するマッピングを作成
        character_rank_map = {}
        for char in characters:
            char_name = char.get('name', '')
            char_rank = char.get('rank')
            if char_name and char_rank:
                character_rank_map[char_name] = char_rank
        
        print(f"Character Ranks: {character_rank_map}")
        
        awarded_results = []
        
        for bet in bets:
            user_id = bet.get('userId')
            user_name = bet.get('displayName', 'Unknown')
            selected_bet = bet.get('selectedBet', '')
            
            if not user_id or user_id == 'unknown':
                print(f"⚠ ユーザーIDが不明: {bet}")
                continue
            
            # ベットしたキャラクターの順位を取得
            bet_rank = character_rank_map.get(selected_bet)
            
            if bet_rank is None:
                print(f"⚠ ベットしたキャラクター'{selected_bet}'の順位が不明")
                continue
            
            # 順位に応じたポイントを取得
            points = POINTS_BY_RANK.get(bet_rank, 0)
            
            if points > 0:
                description = f"レースベット: {selected_bet}({bet_rank}位)"
                
                result = award_points_to_user(
                    user_id=user_id,
                    amount=points,
                    bet_type="race_bet",
                    description=description,
                    related_id=race_id
                )
                
                awarded_results.append({
                    'userId': user_id,
                    'userName': user_name,
                    'selectedBet': selected_bet,
                    'rank': bet_rank,
                    'points': points,
                    'success': result['success']
                })
                
                print(f"✓ {user_name}: {selected_bet}({bet_rank}位) -> {points}pt")
            else:
                print(f"- {user_name}: {selected_bet}({bet_rank}位) -> 0pt (ポイントなし)")
        
        print(f"\n=== ポイント付与完了 ===")
        print(f"付与数: {len(awarded_results)}件")
        
        return {'success': True, 'awarded': awarded_results}
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"\n✗ レースポイント付与エラー:")
        print(error_trace)
        return {
            'success': False,
            'error': f'ポイント付与エラー: {str(e)}',
            'traceback': error_trace
        }


def submit_race_result(characters: List[Dict], bets: Optional[List[Dict]] = None) -> dict:
    """
    レース結果をFirestoreに保存
    1. openのレースがあれば、それをfinishedに更新してwinner情報を追加
    2. なければ直接finishedで作成
    3. 終了後、次のレース用にopenのレースを作成（まだなければ）
    """
    try:
        from datetime import datetime
        import pytz
        import traceback
        
        print(f"\n=== レース結果送信開始 ===")
        print(f"Characters: {characters}")
        print(f"Bets: {bets if bets else 'ベットなし'}")
        
        if not bets:
            bets = []
        
        jst = pytz.timezone('Asia/Tokyo')
        now_jst = datetime.now(jst)
        date_str = now_jst.strftime('%Y-%m-%d')
        timestamp_str = now_jst.isoformat()
        
        # 勝者情報
        winner = next((c for c in characters if c.get('rank') == 1), None)
        if winner:
            print(f"Winner: {winner['name']} ({winner['emoji']})")
        else:
            print("⚠ Winner not found in results")
        
        # ベット情報を集計
        total_bets = len(bets)
        bet_distribution = {}
        for bet in bets:
            bet_char = bet.get('selectedBet', '')
            bet_distribution[bet_char] = bet_distribution.get(bet_char, 0) + 1
        
        print(f"Total Bets: {total_bets}")
        print(f"Bet Distribution: {bet_distribution}")
        
        # 1. openのレースを検索
        print("openのレースを検索中...")
        query_result = query_firestore('races', 'status', '==', 'open')
        
        race_id = None
        if query_result['success'] and len(query_result['documents']) > 0:
            # openのレースがある → finishedに更新
            open_race = query_result['documents'][0]
            race_id = open_race['id']
            print(f"openのレースを発見: {race_id}")
            
            # 更新データ
            update_data = {
                'status': 'finished',
                'endTime': timestamp_str,
                'totalBets': total_bets,
                'winnerCharacterId': winner['characterId'] if winner else None,
                'winnerName': winner['name'] if winner else None,
                'winnerEmoji': winner['emoji'] if winner else None,
                'characters': characters,
                'bets': bets,
                'updatedAt': timestamp_str
            }
            
            print("レースをfinishedに更新中...")
            update_result = update_firestore_document('races', race_id, update_data)
            
            if update_result['success']:
                print(f"✓ レースを更新: {race_id}")
            else:
                print(f"✗ 更新エラー: {update_result['error']}")
                return update_result
        else:
            # openのレースがない → 新規作成（finishedで）
            print("openのレースがないため、新規作成します")
            
            race_data = {
                'date': date_str,
                'status': 'finished',
                'scheduledStartTime': timestamp_str,
                'actualStartTime': timestamp_str,
                'endTime': timestamp_str,
                'totalBets': total_bets,
                'totalBetPoints': 0,
                'winnerCharacterId': winner['characterId'] if winner else None,
                'winnerName': winner['name'] if winner else None,
                'winnerEmoji': winner['emoji'] if winner else None,
                'finalOdds': 1.0,
                'characters': characters,
                'bets': bets,
                'createdAt': timestamp_str,
                'updatedAt': timestamp_str
            }
            
            result = write_to_firestore('races', race_data)
            
            if result['success']:
                race_id = result['id']
                print(f"✓ 新規レースを作成: {race_id}")
            else:
                print(f"✗ 作成エラー: {result['error']}")
                return result
        
        # 2. 次のレース用にopenのレースを作成（まだなければ）
        print("\n次のレース用にopenのレースを確認中...")
        check_result = query_firestore('races', 'status', '==', 'open')
        
        if check_result['success'] and len(check_result['documents']) == 0:
            # openのレースがない → 新規作成
            print("次のレース用にopenのレースを作成...")
            
            # デフォルトのキャラクター（プログラミング言語）
            default_characters = [
                {'characterId': 'c', 'name': 'C言語', 'emoji': '🇨', 'rank': None},
                {'characterId': 'python', 'name': 'Python', 'emoji': '🐍', 'rank': None},
                {'characterId': 'javascript', 'name': 'JavaScript', 'emoji': '🟨', 'rank': None}
            ]
            
            next_race_data = {
                'date': date_str,
                'status': 'open',
                'scheduledStartTime': timestamp_str,
                'totalBets': 0,
                'totalBetPoints': 0,
                'winnerCharacterId': None,
                'winnerName': None,
                'winnerEmoji': None,
                'finalOdds': 1.0,
                'characters': default_characters,
                'bets': [],
                'createdAt': timestamp_str,
                'updatedAt': timestamp_str
            }
            
            next_result = write_to_firestore('races', next_race_data)
            
            if next_result['success']:
                print(f"✓ 次のレース用openを作成: {next_result['id']}")
            else:
                print(f"⚠ 次のレース作成に失敗: {next_result['error']}")
        else:
            print("openのレースが既に存在します。作成をスキップ。")
        
        # 3. ベット結果に応じてポイントを付与
        print("\nポイント付与処理開始...")
        points_result = award_points_for_race(characters, bets, race_id)
        
        if points_result['success']:
            awarded_count = len(points_result.get('awarded', []))
            print(f"✓ ポイント付与完了: {awarded_count}件")
        else:
            print(f"⚠ ポイント付与に失敗: {points_result.get('error')}")
        
        return {
            'success': True, 
            'data': {
                'id': race_id,
                'status': 'finished',
                'winnerName': winner['name'] if winner else None,
                'pointsAwarded': points_result.get('awarded', [])
            }
        }
            
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"\n✗ レース結果送信エラー:")
        print(error_trace)
        return {
            'success': False,
            'error': f'通信エラー: {str(e)}',
            'traceback': error_trace
        }


@app.get("/")
async def root():
    """ヘルスチェック"""
    return {
        "status": "ok",
        "service": "部室王 Hardware API",
        "nfc_listening": nfc_listening,
        "connected_clients": len(websocket_connections)
    }


@app.get("/api/ranking")
async def get_ranking(limit: int = 10):
    """ランキング取得（外部API経由）"""
    result = fetch_ranking_from_api(limit)
    
    if result['success']:
        return result['data']
    else:
        raise HTTPException(status_code=500, detail=result['error'])


@app.get("/api/attendance/today-count")
async def get_today_attendance_count():
    """今日のログイン人数取得（外部API経由）"""
    try:
        result = fetch_today_attendance_count()
        
        if result['success']:
            # Vue側が期待する形式で返す: { success: true, data: { count: N } }
            return {
                'success': True,
                'data': result['data']
            }
        else:
            # エラー詳細をログに出力
            print(f"Attendance count fetch failed: {result.get('error')}")
            if 'traceback' in result:
                print(f"Traceback: {result['traceback']}")
            
            # フォールバック: ダミー値を返す
            print("⚠ フォールバック: ダミー値を返します")
            return {
                'success': True,
                'data': {
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'count': 0
                }
            }
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"\n✗ エンドポイントエラー:")
        print(error_trace)
        
        # エラー時もダミー値を返す
        return {
            'success': True,
            'data': {
                'date': datetime.now().strftime('%Y-%m-%d'),
                'count': 0
            }
        }


@app.post("/api/races/result")
async def submit_race(race_data: RaceResultData):
    """レース結果をFirebaseに送信"""
    try:
        characters = [c.dict() for c in race_data.characters]
        
        # JSONファイルからベット情報を取得
        bets = load_bets()
        print(f"JSONファイルから取得したベット情報: {len(bets)}件")
        
        result = submit_race_result(characters, bets)
        
        if result['success']:
            # レース終了後、ベット情報をクリア
            clear_bets()
            return result['data']
        else:
            error_detail = result.get('error', 'Unknown error')
            if 'traceback' in result:
                print(f"Traceback: {result['traceback']}")
            raise HTTPException(
                status_code=500, 
                detail=error_detail
            )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"\n✗ エンドポイントエラー:")
        print(error_trace)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


# ベット情報管理エンドポイント
@app.get("/api/bets")
async def get_bets():
    """現在のベット情報を取得"""
    bets = load_bets()
    return {"success": True, "bets": bets, "count": len(bets)}


@app.post("/api/bets")
async def add_bet_endpoint(bet_info: BetInfo):
    """ベット情報を追加"""
    try:
        success = add_bet(bet_info.dict())
        if success:
            return {"success": True, "message": "ベット情報を保存しました"}
        else:
            raise HTTPException(status_code=500, detail="ベット情報の保存に失敗しました")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/bets")
async def clear_bets_endpoint():
    """ベット情報をクリア"""
    try:
        success = clear_bets()
        if success:
            return {"success": True, "message": "ベット情報をクリアしました"}
        else:
            raise HTTPException(status_code=500, detail="ベット情報のクリアに失敗しました")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
