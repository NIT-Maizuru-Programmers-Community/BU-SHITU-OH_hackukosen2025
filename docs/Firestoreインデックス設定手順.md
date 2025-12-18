# Firestore インデックス設定手順

## 概要

Firestore で複雑なクエリ（`where` + `orderBy` など）を実行する際に必要なインデックスの設定方法を説明します。

## エラーの原因

以下のようなエラーが発生した場合、インデックスが必要です：

```
FirebaseError: The query requires an index. You can create it here: https://...
```

## 必要なインデックス

このプロジェクトでは以下のインデックスが必要です：

1. **points コレクション**

   - `userId` (昇順) + `createdAt` (降順)
   - ポイント履歴をユーザーごとに時系列で取得するため

2. **races コレクション**

   - `status` (昇順) + `date` (降順)
   - 完了したレースを日付順に取得するため

3. **attendance コレクション**
   - `status` (昇順) + `checkInTime` (降順)
   - 在室状況を時系列で取得するため

## インデックス作成方法

### 方法 1: エラーメッセージのリンクから作成（最も簡単）

1. アプリを起動してエラーが発生したページを開く
2. ブラウザの開発者ツール（Console）でエラーメッセージを確認
3. エラーメッセージ内の URL をクリック
4. Firebase Console のインデックス作成画面が開く
5. 「インデックスを作成」ボタンをクリック
6. 数分待って完了

### 方法 2: Firebase CLI を使用（推奨）

プロジェクトに `firestore.indexes.json` が用意されています。

#### 1. Firebase CLI のインストール

```bash
npm install -g firebase-tools
```

#### 2. Firebase にログイン

```bash
firebase login
```

#### 3. Firebase プロジェクトを初期化（初回のみ）

```bash
firebase init firestore
```

- 既存のプロジェクトを選択
- Firestore rules と indexes の設定ファイルを選択
- 既存の `firestore.indexes.json` を使用

#### 4. インデックスをデプロイ

```bash
firebase deploy --only firestore:indexes
```

実行結果：

```
=== Deploying to 'your-project-id'...

i  firestore: reading indexes from firestore.indexes.json...
✔  firestore: deployed indexes in firestore.indexes.json successfully
```

#### 5. インデックス作成を待つ

Firebase Console で確認すると、インデックスが作成中になっています。
数分待つと「有効」になり、クエリが正常に動作します。

### 方法 3: Firebase Console で手動作成

#### ポイント履歴用インデックス

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクトを選択
3. 「Firestore Database」→「インデックス」タブ
4. 「複合インデックスを作成」をクリック
5. 以下を設定：

```
コレクション ID: points

フィールド 1:
  フィールドパス: userId
  並び順: 昇順

フィールド 2:
  フィールドパス: createdAt
  並び順: 降順

クエリのスコープ: コレクション
```

6. 「作成」をクリック

#### レース履歴用インデックス

同様に以下のインデックスを作成：

```
コレクション ID: races

フィールド 1:
  フィールドパス: status
  並び順: 昇順

フィールド 2:
  フィールドパス: date
  並び順: 降順

クエリのスコープ: コレクション
```

#### 在室状況用インデックス

```
コレクション ID: attendance

フィールド 1:
  フィールドパス: status
  並び順: 昇順

フィールド 2:
  フィールドパス: checkInTime
  並び順: 降順

クエリのスコープ: コレクション
```

## インデックスの確認

### Firebase Console で確認

1. 「Firestore Database」→「インデックス」タブ
2. 作成したインデックスが表示される
3. ステータスが「有効」になっていることを確認

### アプリで確認

1. アプリを起動
2. エラーが発生していたページを開く
3. エラーが解消され、データが正常に表示されることを確認

## トラブルシューティング

### インデックスが「作成中」のまま長時間経過

- 通常は数分で完了しますが、データ量が多い場合は時間がかかることがあります
- 30 分以上経過しても完了しない場合は、Firebase サポートに問い合わせ

### エラーメッセージが表示されない

- ブラウザの開発者ツール（Console）を確認
- `npm run dev` でアプリを起動してページを開く
- ネットワークタブでエラーを確認

### インデックスを作成したのにエラーが出る

- ステータスが「有効」になっているか確認
- ブラウザをリロード（キャッシュクリア）
- アプリを再起動

## 参考情報

- [Firestore インデックスの概要](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase CLI リファレンス](https://firebase.google.com/docs/cli)

