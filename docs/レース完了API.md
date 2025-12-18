# レース完了 API ドキュメント

ハードウェア側からレースの結果を保存し、配当を計算する API です。

---

## API エンドポイント

### POST /api/race/complete

レースを完了し、勝者を決定して、当選ベットに対する配当を自動計算・付与します。

#### 認証

ハードウェア API Key が必要です。

```
X-API-Key: your-hardware-api-key
```

#### リクエスト

```typescript
POST /api/race/complete
Content-Type: application/json
X-API-Key: your-hardware-api-key

{
  "raceId": "race_12345",              // レースID（必須）
  "winnerCharacterId": "cheetah",      // 勝者のキャラクターID（必須）
  "results": [                         // 全キャラクターの順位（オプション）
    {
      "characterId": "cheetah",
      "rank": 1
    },
    {
      "characterId": "rabbit",
      "rank": 2
    },
    {
      "characterId": "lion",
      "rank": 3
    }
  ]
}
```

#### レスポンス（成功）

```json
{
	"success": true,
	"message": "レースが完了しました",
	"data": {
		"race": {
			"id": "race_12345",
			"winnerCharacterId": "cheetah",
			"winnerName": "チーター",
			"winnerEmoji": "🐆",
			"odds": 2.5,
			"totalBets": 5,
			"totalPayouts": 1250
		},
		"payouts": [
			{
				"userId": "user_aaa",
				"betAmount": 100,
				"payout": 250,
				"profit": 150,
				"newBalance": 1350
			},
			{
				"userId": "user_bbb",
				"betAmount": 200,
				"payout": 500,
				"profit": 300,
				"newBalance": 2800
			}
		]
	}
}
```

#### エラーレスポンス

**レースが見つからない**

```json
{
	"success": false,
	"error": "レースが見つかりません",
	"code": "NOT_FOUND"
}
```

**レースが既に完了している**

```json
{
	"success": false,
	"error": "レースは既に完了しています",
	"code": "RACE_CLOSED"
}
```

**勝者キャラクターが参加していない**

```json
{
	"success": false,
	"error": "指定されたキャラクターはレースに参加していません",
	"code": "BAD_REQUEST"
}
```

---

## 処理フロー

1. **レースの検証**

   - レースが存在するか確認
   - レースがまだ完了していないか確認
   - 勝者キャラクターがレースに参加しているか確認

2. **オッズの計算**

   ```
   オッズ = 総ベット額 ÷ 勝者へのベット額
   ```

   - 最小オッズは 1.0 倍

3. **配当の計算と付与**

   - 勝者キャラクターにベットした全ユーザーを取得
   - 各ユーザーに配当を付与:
     ```
     配当 = ベット額 × オッズ
     ```
   - ポイント履歴に記録

4. **レースの完了**
   - 勝者キャラクター情報を記録
   - ステータスを `completed` に更新
   - 最終オッズと総配当額を記録

---

## 使用例

### curl でのテスト

```bash
# レースを完了して勝者キャラクターを決定
curl -X POST https://your-app.vercel.app/api/race/complete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-hardware-api-key" \
  -d '{
    "raceId": "race_2025-12-14",
    "winnerCharacterId": "cheetah",
    "results": [
      {
        "characterId": "cheetah",
        "rank": 1
      },
      {
        "characterId": "rabbit",
        "rank": 2
      },
      {
        "characterId": "lion",
        "rank": 3
      }
    ]
  }'
```

### Python での実装例

```python
import requests
import os

def complete_race(race_id: str, winner_character_id: str, results: list = None):
    """
    レースを完了して結果を保存
    """
    url = f"{os.getenv('API_ENDPOINT')}/api/race/complete"
    api_key = os.getenv('HARDWARE_API_KEY')

    payload = {
        'raceId': race_id,
        'winnerCharacterId': winner_character_id
    }

    if results:
        payload['results'] = results

    response = requests.post(
        url,
        json=payload,
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        },
        timeout=30
    )

    if response.status_code == 200:
        data = response.json()
        print(f"✓ レース完了")
        print(f"  勝者: {data['data']['race']['winnerName']} {data['data']['race']['winnerEmoji']}")
        print(f"  オッズ: {data['data']['race']['odds']}倍")
        print(f"  総配当: {data['data']['race']['totalPayouts']}pt")
        return data
    else:
        print(f"✗ エラー: {response.status_code}")
        print(response.text)
        return None

# 使用例
if __name__ == '__main__':
    # ランダム抽選の結果
    results = [
        {'characterId': 'cheetah', 'rank': 1},
        {'characterId': 'rabbit', 'rank': 2},
        {'characterId': 'lion', 'rank': 3},
    ]

    complete_race(
        race_id='race_2025-12-14',
        winner_character_id='cheetah',
        results=results
    )
```

### Raspberry Pi での自動実行例

毎日 18:00 にレースを締め切り、ランダムで勝者を決定する例:

```python
#!/usr/bin/env python3
"""
自動レース締切スクリプト
毎日18:00に実行（cronで設定）
"""

import requests
import os
import random
from datetime import datetime, date
from dotenv import load_dotenv

load_dotenv()

API_ENDPOINT = os.getenv('API_ENDPOINT')
API_KEY = os.getenv('HARDWARE_API_KEY')

def get_today_race():
    """今日のレースを取得"""
    response = requests.get(
        f"{API_ENDPOINT}/api/race/today",
        headers={'X-API-Key': API_KEY}
    )
    if response.status_code == 200:
        data = response.json()
        return data.get('data', {}).get('race')
    return None

def select_winner_randomly(characters):
    """ランダムに勝者キャラクターを決定"""
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

    return winner_character_id, results

def main():
    print(f"[{datetime.now()}] レース締切処理を開始")

    # 今日のレースを取得
    race = get_today_race()

    if not race:
        print("本日のレースが見つかりません")
        return

    race_id = race['id']
    characters = race.get('characters', [])

    print(f"レースID: {race_id}")
    print(f"参加キャラクター数: {len(characters)}体")

    # ランダムに勝者キャラクターを選択
    winner_character_id, results = select_winner_randomly(characters)

    if not winner_character_id:
        print("参加キャラクターがいないため、レースを完了できません")
        return

    # レースを完了
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
        }
    )

    if response.status_code == 200:
        data = response.json()
        print(f"✓ レース完了!")
        print(f"  勝者: {data['data']['race']['winnerName']} {data['data']['race']['winnerEmoji']}")
        print(f"  オッズ: {data['data']['race']['odds']}倍")
        print(f"  総配当: {data['data']['race']['totalPayouts']}pt")
    else:
        print(f"✗ エラー: {response.status_code}")
        print(response.text)

if __name__ == '__main__':
    main()
```

**cron 設定例（毎日 18:00 に実行）:**

```bash
# crontab -e
0 18 * * * /usr/bin/python3 /home/pi/race-scripts/auto_complete_race.py >> /var/log/race_complete.log 2>&1
```

---

## 配当計算の詳細

### オッズの計算式

```
オッズ = 総ベット額 ÷ 勝者へのベット額
```

**例:**

- 総ベット額: 1000 pt
- チーター へのベット: 200 pt
- ウサギ へのベット: 300 pt
- ライオン へのベット: 500 pt

チーター が勝った場合:

```
オッズ = 1000 ÷ 200 = 5.0 倍
```

### 配当の計算

各当選者への配当:

```
配当 = ベット額 × オッズ
```

**例:**

- 田中さんがチーターに 100pt ベット → 配当 = 100 × 5.0 = 500pt
- 佐藤さんがチーターに 50pt ベット → 配当 = 50 × 5.0 = 250pt

---

## 注意事項

1. **API Key の管理**

   - `HARDWARE_API_KEY` を安全に管理してください
   - Git にコミットしないこと

2. **レースの状態**

   - 同じレースを複数回完了させることはできません
   - 完了後は結果の変更はできません

3. **トランザクション処理**

   - 配当の付与は原子的に処理されます
   - 一部のユーザーへの配当が失敗しても、他のユーザーには正常に付与されます

4. **エラーハンドリング**
   - レース完了処理は重要なため、必ずレスポンスを確認してください
   - エラーが発生した場合はログに記録し、手動で対応してください

---

## トラブルシューティング

### エラー: "レースは既に完了しています"

レースは一度しか完了できません。`GET /api/race/result?raceId=xxx` で結果を確認してください。

### エラー: "指定されたキャラクターはレースに参加していません"

`winnerCharacterId` がレースの参加キャラクターに含まれているか確認してください。
`GET /api/race/today` で参加キャラクター一覧を取得できます。

### 配当が付与されない

- API Key が正しく設定されているか確認
- ネットワーク接続を確認
- レスポンスの `payouts` フィールドを確認

---

## まとめ

レース完了 API を使用することで:

- ハードウェアから自動的にレースを締め切り
- 勝者を決定
- 配当を自動計算・付与

が可能になります。

ランダム抽選レースは、毎日自動で実行するスクリプトを作成することを推奨します。
