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
  "raceId": "race_12345",           // レースID（必須）
  "winnerId": "user_abc123",        // 勝者のユーザーID（必須）
  "results": [                      // 全参加者の順位（オプション）
    {
      "userId": "user_abc123",
      "rank": 1,
      "stayDuration": 14400         // 在室時間（秒）
    },
    {
      "userId": "user_def456",
      "rank": 2,
      "stayDuration": 12000
    },
    {
      "userId": "user_ghi789",
      "rank": 3,
      "stayDuration": 9600
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
			"winnerId": "user_abc123",
			"winnerDisplayName": "山田太郎",
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

**勝者が参加者に含まれていない**

```json
{
	"success": false,
	"error": "指定された勝者はレースに参加していません",
	"code": "BAD_REQUEST"
}
```

---

## 処理フロー

1. **レースの検証**

   - レースが存在するか確認
   - レースがまだ完了していないか確認
   - 勝者が参加者に含まれているか確認

2. **オッズの計算**

   ```
   オッズ = 総ベット額 ÷ 勝者へのベット額
   ```

   - 最小オッズは 1.0 倍

3. **配当の計算と付与**

   - 勝者にベットした全ユーザーを取得
   - 各ユーザーに配当を付与:
     ```
     配当 = ベット額 × オッズ
     ```
   - ポイント履歴に記録

4. **レースの完了**
   - 勝者情報を記録
   - ステータスを `completed` に更新
   - 最終オッズと総配当額を記録

---

## 使用例

### curl でのテスト

```bash
# レースを完了して勝者を決定
curl -X POST https://your-app.vercel.app/api/race/complete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-hardware-api-key" \
  -d '{
    "raceId": "race_2025-12-14",
    "winnerId": "user_abc123",
    "results": [
      {
        "userId": "user_abc123",
        "rank": 1,
        "stayDuration": 14400
      },
      {
        "userId": "user_def456",
        "rank": 2,
        "stayDuration": 12000
      }
    ]
  }'
```

### Python での実装例

```python
import requests
import os

def complete_race(race_id: str, winner_id: str, results: list = None):
    """
    レースを完了して結果を保存
    """
    url = f"{os.getenv('API_ENDPOINT')}/api/race/complete"
    api_key = os.getenv('HARDWARE_API_KEY')

    payload = {
        'raceId': race_id,
        'winnerId': winner_id
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
        print(f"  勝者: {data['data']['race']['winnerDisplayName']}")
        print(f"  オッズ: {data['data']['race']['odds']}倍")
        print(f"  総配当: {data['data']['race']['totalPayouts']}pt")
        return data
    else:
        print(f"✗ エラー: {response.status_code}")
        print(response.text)
        return None

# 使用例
if __name__ == '__main__':
    # 在室時間レースの結果
    results = [
        {'userId': 'user_abc123', 'rank': 1, 'stayDuration': 14400},
        {'userId': 'user_def456', 'rank': 2, 'stayDuration': 12000},
        {'userId': 'user_ghi789', 'rank': 3, 'stayDuration': 9600},
    ]

    complete_race(
        race_id='race_2025-12-14',
        winner_id='user_abc123',
        results=results
    )
```

### Raspberry Pi での自動実行例

毎日 18:00 にレースを締め切り、在室時間から勝者を決定する例:

```python
#!/usr/bin/env python3
"""
自動レース締切スクリプト
毎日18:00に実行（cronで設定）
"""

import requests
import os
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

def calculate_winner_from_attendance(race_id):
    """在室時間から勝者を決定"""
    # attendance データから在室時間を計算
    # (実際の実装では Firestore から取得)

    # 仮のデータ
    attendance_data = [
        {'userId': 'user_abc123', 'displayName': '山田太郎', 'duration': 14400},
        {'userId': 'user_def456', 'displayName': '佐藤花子', 'duration': 12000},
        {'userId': 'user_ghi789', 'displayName': '鈴木次郎', 'duration': 9600},
    ]

    # 在室時間でソート
    sorted_data = sorted(attendance_data, key=lambda x: x['duration'], reverse=True)

    # 結果データを構築
    results = [
        {
            'userId': user['userId'],
            'rank': idx + 1,
            'stayDuration': user['duration']
        }
        for idx, user in enumerate(sorted_data)
    ]

    winner_id = sorted_data[0]['userId']

    return winner_id, results

def main():
    print(f"[{datetime.now()}] レース締切処理を開始")

    # 今日のレースを取得
    race = get_today_race()

    if not race:
        print("本日のレースが見つかりません")
        return

    race_id = race['id']
    print(f"レースID: {race_id}")

    # 勝者を計算
    winner_id, results = calculate_winner_from_attendance(race_id)

    # レースを完了
    response = requests.post(
        f"{API_ENDPOINT}/api/race/complete",
        json={
            'raceId': race_id,
            'winnerId': winner_id,
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
        print(f"  勝者: {data['data']['race']['winnerDisplayName']}")
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
- ユーザー A へのベット: 200 pt
- ユーザー B へのベット: 300 pt
- ユーザー C へのベット: 500 pt

ユーザー A が勝った場合:

```
オッズ = 1000 ÷ 200 = 5.0 倍
```

### 配当の計算

各当選者への配当:

```
配当 = ベット額 × オッズ
```

**例:**

- 田中さんがユーザー A に 100pt ベット → 配当 = 100 × 5.0 = 500pt
- 佐藤さんがユーザー A に 50pt ベット → 配当 = 50 × 5.0 = 250pt

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

### エラー: "指定された勝者はレースに参加していません"

`winnerId` がレースの参加者に含まれているか確認してください。
`GET /api/race/today` で参加者一覧を取得できます。

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

在室時間レースの場合は、毎日自動で実行するスクリプトを作成することを推奨します。
