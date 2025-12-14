# Firebase 設定手順

このドキュメントでは、Firebase プロジェクトの設定方法を説明します。

## 前提条件

- Google アカウントが必要です
- Firebase Console にアクセスできること

## ステップ 1: Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `busshitsu-oh` または `hacku2025`）
4. Google アナリティクスの設定（任意、後で有効化も可能）
5. 「プロジェクトを作成」をクリックして完了を待つ

## ステップ 2: Web アプリの登録

1. Firebase Console のプロジェクトのホーム画面で、「Web」アイコン（`</>`）をクリック
2. アプリのニックネームを入力（例: `部室王 Web`）
3. 「Firebase Hosting を設定」はチェック不要（Vercel を使用）
4. 「アプリを登録」をクリック
5. 表示される設定情報をコピー

## ステップ 3: 環境変数の設定

1. プロジェクトのルートディレクトリに `.env.local` ファイルを作成
2. `.env.example` をコピーして、以下の値を入力：

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=（ステップ2で取得した apiKey）
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=（ステップ2で取得した authDomain）
NEXT_PUBLIC_FIREBASE_PROJECT_ID=（ステップ2で取得した projectId）
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=（ステップ2で取得した storageBucket）
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=（ステップ2で取得した messagingSenderId）
NEXT_PUBLIC_FIREBASE_APP_ID=（ステップ2で取得した appId）
```

## ステップ 4: Firebase Authentication の有効化

1. Firebase Console の左メニューから「Authentication」をクリック
2. 「始める」をクリック
3. 「Sign-in method」タブで「メール/パスワード」を有効化
4. 必要に応じて「Google」認証も有効化

## ステップ 5: Firestore Database の作成

1. Firebase Console の左メニューから「Firestore Database」をクリック
2. 「データベースを作成」をクリック
3. セキュリティルールを選択：
   - 開発中: 「テストモードで開始」を選択（注意: 本番環境では必ずセキュリティルールを設定）
   - 本番: 「ロックモードで開始」を選択し、後でルールを設定
4. ロケーションを選択（推奨: `asia-northeast1` (東京) または `asia-northeast2` (大阪)）
5. 「有効にする」をクリック

## ステップ 6: Firestore セキュリティルールの設定（本番環境用）

開発が進んだら、以下のようなセキュリティルールを設定してください：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のドキュメントのみ読み書き可能
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // ポイント履歴は読み取り専用
    match /points/{pointId} {
      allow read: if request.auth != null;
      allow write: if false; // サーバーサイドのみ
    }

    // レース情報は全員が閲覧可能
    match /races/{raceId} {
      allow read: if request.auth != null;
      allow write: if false; // サーバーサイドのみ
    }

    // ベット情報はユーザー自身のみ閲覧可能
    match /bets/{betId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    // 送金履歴は関係者のみ閲覧可能
    match /transfers/{transferId} {
      allow read: if request.auth != null &&
        (resource.data.senderId == request.auth.uid ||
         resource.data.receiverId == request.auth.uid);
      allow write: if request.auth != null && request.resource.data.senderId == request.auth.uid;
    }

    // 在室ログは全員が閲覧可能
    match /attendance/{attendanceId} {
      allow read: if request.auth != null;
      allow write: if false; // サーバーサイドのみ
    }
  }
}
```

## ステップ 7: Firebase Admin SDK の設定（サーバーサイド用）

1. Firebase Console の左上の歯車アイコン → 「プロジェクトの設定」をクリック
2. 「サービス アカウント」タブを選択
3. 「新しい秘密鍵の生成」をクリック
4. JSON ファイルがダウンロードされる
5. JSON ファイルから以下の値を `.env.local` に追加：

```bash
FIREBASE_ADMIN_PROJECT_ID=（JSON の project_id）
FIREBASE_ADMIN_CLIENT_EMAIL=（JSON の client_email）
FIREBASE_ADMIN_PRIVATE_KEY=（JSON の private_key）
```

**注意**: `private_key` は改行文字 `\n` を含むため、必ずダブルクォートで囲んでください。

## ステップ 8: Storage の設定（画像アップロード用）

1. Firebase Console の左メニューから「Storage」をクリック
2. 「始める」をクリック
3. セキュリティルールを選択（開発中はテストモード、本番は適切なルールを設定）
4. ロケーションを選択（Firestore と同じロケーションを推奨）
5. 「完了」をクリック

## 完了

これで Firebase の設定が完了しました。開発サーバーを起動して動作確認してください：

```bash
npm run dev
```

## トラブルシューティング

### エラー: "Firebase: Error (auth/configuration-not-found)"

- Firebase Authentication が有効になっているか確認
- 環境変数が正しく設定されているか確認
- `.env.local` ファイルを変更した後、開発サーバーを再起動

### エラー: "Missing or insufficient permissions"

- Firestore のセキュリティルールを確認
- 開発中はテストモードで開始することを推奨

### 環境変数が読み込まれない

- Next.js では `NEXT_PUBLIC_` プレフィックスが付いた変数のみクライアントサイドで利用可能
- サーバーサイド専用の変数にはプレフィックスは不要
- `.env.local` ファイルを変更したら必ず開発サーバーを再起動



