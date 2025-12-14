# Firebase 認証トークン取得方法

API テストで必要な Firebase Auth Token を取得する方法をまとめています。

---

## 方法 1: 開発ツールページから取得（最も簡単）

### 手順

1. **開発サーバーを起動**

   ```bash
   npm run dev
   ```

2. **開発ツールページにアクセス**

   ```
   http://localhost:3000/dev-tools
   ```

3. **Google でログイン**

   - ログインしていない場合は、ボタンからログイン

4. **トークンをコピー**
   - 「トークンをコピー」ボタンをクリック
   - または「curl コマンドをコピー」で、そのまま使える curl コマンドをコピー

### 特徴

- ✅ ブラウザから簡単に取得
- ✅ curl コマンドも自動生成
- ✅ ユーザー情報も確認可能
- ✅ トークンの更新も簡単

### 注意

⚠️ **本番環境にデプロイする前に `/app/dev-tools` フォルダを削除してください**

---

## 方法 2: ブラウザのコンソールから取得

### 手順

1. **アプリにログイン**

   ```
   http://localhost:3000
   ```

2. **開発者ツールを開く**

   - Chrome/Edge: `F12` または `Cmd+Option+I` (Mac)
   - Firefox: `F12` または `Cmd+Option+K` (Mac)

3. **コンソールタブで以下を実行**

   ```javascript
   // Firebase Auth インスタンスを取得
   import("firebase/auth").then(({ getAuth }) => {
   	const auth = getAuth();
   	const user = auth.currentUser;
   	if (user) {
   		user.getIdToken().then((token) => {
   			console.log("Token:", token);
   			// クリップボードにコピー
   			navigator.clipboard.writeText(token);
   			console.log("トークンをクリップボードにコピーしました！");
   		});
   	} else {
   		console.log("ログインしていません");
   	}
   });
   ```

4. **トークンがコンソールに表示され、クリップボードにコピーされます**

---

## 方法 3: コンポーネント内でプログラムから取得

### useAuth フックを使用

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function MyComponent() {
	const { getToken, user } = useAuth();

	const fetchData = async () => {
		// トークンを取得
		const token = await getToken();

		if (!token) {
			console.error("トークンが取得できませんでした");
			return;
		}

		// API リクエスト
		const response = await fetch(`/api/points/balance?userId=${user?.id}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();
		console.log(data);
	};

	useEffect(() => {
		fetchData();
	}, []);

	return <div>データを取得中...</div>;
}
```

### firebaseUser から直接取得

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";

export default function MyComponent() {
	const { firebaseUser } = useAuth();

	const callAPI = async () => {
		if (!firebaseUser) {
			console.error("ログインしていません");
			return;
		}

		// トークンを取得
		const token = await firebaseUser.getIdToken();

		// API 呼び出し
		const response = await fetch("/api/auth/daily-bonus", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const data = await response.json();
		console.log(data);
	};

	return (
		<button onClick={callAPI} disabled={!firebaseUser}>
			ログインボーナスを取得
		</button>
	);
}
```

---

## 方法 4: curl / CLI からテスト

### ステップ 1: トークンを取得

上記の方法 1 または 2 でトークンを取得します。

### ステップ 2: 環境変数にセット

```bash
# トークンを環境変数に保存
export FIREBASE_TOKEN="your-token-here"
export USER_ID="your-user-id"
```

### ステップ 3: API を呼び出し

```bash
# ポイント残高取得
curl -X GET "http://localhost:3000/api/points/balance?userId=$USER_ID" \
  -H "Authorization: Bearer $FIREBASE_TOKEN"

# ログインボーナス取得
curl -X POST http://localhost:3000/api/auth/daily-bonus \
  -H "Authorization: Bearer $FIREBASE_TOKEN"

# ポイント履歴
curl -X GET "http://localhost:3000/api/points/history?userId=$USER_ID" \
  -H "Authorization: Bearer $FIREBASE_TOKEN"

# ポイント送金
curl -X POST http://localhost:3000/api/transfer/send \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "receiver-user-id",
    "amount": 10,
    "message": "テスト送金"
  }'
```

---

## 方法 5: Python スクリプトから取得

### ステップ 1: Firebase Admin SDK でカスタムトークンを作成

```python
import firebase_admin
from firebase_admin import credentials, auth
import requests

# Firebase Admin SDK の初期化
cred = credentials.Certificate('path/to/serviceAccountKey.json')
firebase_admin.initialize_app(cred)

# カスタムトークンを作成
uid = 'test-user-id'
custom_token = auth.create_custom_token(uid)

print(f"Custom Token: {custom_token.decode()}")
```

### ステップ 2: カスタムトークンを ID トークンに交換

```python
import requests

def get_id_token_from_custom_token(custom_token, api_key):
    """カスタムトークンをIDトークンに交換"""
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={api_key}"

    response = requests.post(url, json={
        'token': custom_token,
        'returnSecureToken': True
    })

    if response.status_code == 200:
        data = response.json()
        return data['idToken']
    else:
        raise Exception(f"Token exchange failed: {response.text}")

# 使用例
api_key = "your-firebase-web-api-key"  # Firebase Console から取得
id_token = get_id_token_from_custom_token(custom_token.decode(), api_key)
print(f"ID Token: {id_token}")

# API を呼び出し
response = requests.get(
    'http://localhost:3000/api/points/balance',
    params={'userId': uid},
    headers={'Authorization': f'Bearer {id_token}'}
)
print(response.json())
```

---

## トークンの特徴

### 有効期限

- **Firebase ID Token の有効期限: 1 時間**
- 期限切れの場合は再取得が必要

### トークンの更新

```javascript
// 強制的に新しいトークンを取得
const token = await user.getIdToken(true); // true = force refresh
```

または

```typescript
const { getToken } = useAuth();
const token = await getToken(); // 内部で自動的に更新
```

### セキュリティ

- ⚠️ トークンは機密情報です
- Git にコミットしないこと
- 第三者と共有しないこと
- 本番環境のトークンは特に注意

---

## トラブルシューティング

### エラー: "auth/id-token-expired"

**原因**: トークンの有効期限が切れています（1 時間）

**対処法**: 新しいトークンを取得してください

```javascript
// 強制更新
const token = await firebaseUser.getIdToken(true);
```

### エラー: "auth/user-not-found"

**原因**: ユーザーが Firebase Authentication に存在しません

**対処法**:

1. Google ログインを実行
2. Firebase Console → Authentication でユーザーを確認

### エラー: "ユーザーがログインしていません"

**原因**: `firebaseUser` が null です

**対処法**:

1. アプリにログイン
2. `useAuth()` フックで `firebaseUser` を確認

---

## まとめ

### 推奨される方法

1. **開発中**: `/dev-tools` ページから取得（最も簡単）
2. **自動テスト**: Python スクリプトでカスタムトークンを使用
3. **アプリ内**: `useAuth()` フックの `getToken()` 関数を使用

### 注意事項

- ⚠️ `/dev-tools` ページは本番環境にデプロイしないこと
- トークンは 1 時間で期限切れになる
- セキュリティに注意して取り扱う
