#!/usr/bin/env python3
"""
自動レース締切スクリプト（ランダム抽選版）
毎日18:00に実行（cronで設定）

使い方:
1. .env ファイルに以下を設定:
   API_ENDPOINT=https://your-app.vercel.app
   HARDWARE_API_KEY=your-hardware-api-key

2. crontab に追加:
   0 18 * * * /usr/bin/python3 /path/to/auto_complete_race.py >> /var/log/race_complete.log 2>&1
"""

import requests
import os
import random
from datetime import datetime
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv()

API_ENDPOINT = os.getenv('API_ENDPOINT')
API_KEY = os.getenv('HARDWARE_API_KEY')

def get_today_race():
    """今日のレースを取得"""
    try:
        response = requests.get(
            f"{API_ENDPOINT}/api/race/today",
            headers={'X-API-Key': API_KEY},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get('data', {}).get('race')
        else:
            print(f"レース取得エラー: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"API通信エラー: {e}")
        return None

def select_winner_randomly(characters):
    """ランダムに勝者キャラクターを決定
    
    Args:
        characters: 参加キャラクターリスト
        
    Returns:
        (winner_character_id, results): 勝者キャラクターIDと全キャラクターの順位リスト
    """
    if not characters:
        return None, []
    
    # キャラクターをシャッフルしてランダムに順位付け
    shuffled = characters.copy()
    random.shuffle(shuffled)
    
    # 結果データを構築
    results = [
        {
            'characterId': char['characterId'],
            'rank': idx + 1
        }
        for idx, char in enumerate(shuffled)
    ]
    
    winner_character_id = shuffled[0]['characterId']
    
    print(f"抽選結果:")
    for idx, char in enumerate(shuffled[:3], 1):  # 上位3体を表示
        emoji = char.get('emoji', '')
        name = char.get('name', char['characterId'])
        print(f"  {idx}位: {emoji} {name}")
    
    return winner_character_id, results

def complete_race(race_id, winner_character_id, results):
    """レースを完了
    
    Args:
        race_id: レースID
        winner_character_id: 勝者のキャラクターID
        results: 全キャラクターの順位リスト
        
    Returns:
        bool: 成功したかどうか
    """
    try:
        response = requests.post(
            f"{API_ENDPOINT}/api/race/complete",
            json={
                'raceId': race_id,
                'winnerCharacterId': winner_character_id,
                'results': results
            },
            headers={
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            race_data = data.get('data', {}).get('race', {})
            
            winner_name = race_data.get('winnerName', '不明')
            winner_emoji = race_data.get('winnerEmoji', '')
            
            print(f"✓ レース完了!")
            print(f"  勝者: {winner_emoji} {winner_name}")
            print(f"  オッズ: {race_data.get('odds', 0):.2f}倍")
            print(f"  総配当: {race_data.get('totalPayouts', 0)}pt")
            print(f"  的中数: {race_data.get('totalBets', 0)}件")
            
            return True
        else:
            print(f"✗ レース完了エラー: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"✗ API通信エラー: {e}")
        return False

def main():
    """メイン処理"""
    print("=" * 60)
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] レース締切処理を開始")
    print("=" * 60)
    
    # 環境変数のチェック
    if not API_ENDPOINT or not API_KEY:
        print("✗ エラー: 環境変数が設定されていません")
        print("  API_ENDPOINT と HARDWARE_API_KEY を .env に設定してください")
        return
    
    print(f"API エンドポイント: {API_ENDPOINT}")
    
    # 今日のレースを取得
    race = get_today_race()
    
    if not race:
        print("✗ 本日のレースが見つかりません")
        print("  レースが作成されていないか、既に完了している可能性があります")
        return
    
    race_id = race['id']
    characters = race.get('characters', [])
    
    print(f"\nレースID: {race_id}")
    print(f"参加キャラクター数: {len(characters)}体")
    
    if len(characters) == 0:
        print("✗ 参加キャラクターがいないため、レースを完了できません")
        return
    
    # キャラクターリストを表示
    print("\n参加キャラクター:")
    for c in characters:
        emoji = c.get('emoji', '')
        name = c.get('name', c.get('characterId', '不明'))
        total_bets = c.get('totalBetPoints', 0)
        print(f"  - {emoji} {name} (ベット総額: {total_bets}pt)")
    
    # ランダムに勝者キャラクターを選択
    print("\n抽選中...")
    winner_character_id, results = select_winner_randomly(characters)
    
    if not winner_character_id:
        print("✗ 勝者の選択に失敗しました")
        return
    
    # レースを完了
    print("\nレース完了処理中...")
    success = complete_race(race_id, winner_character_id, results)
    
    if success:
        print("\n" + "=" * 60)
        print("レース締切処理が正常に完了しました")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("レース締切処理に失敗しました")
        print("=" * 60)

if __name__ == '__main__':
    main()

