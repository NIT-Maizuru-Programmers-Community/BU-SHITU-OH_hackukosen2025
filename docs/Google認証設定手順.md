# Google 認証設定手順

Firebase で Google 認証を有効にする手順です。

## ステップ 1: Firebase Console にアクセス

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクトを選択

## ステップ 2: Authentication を有効化

1. 左メニューから「Authentication」をクリック
2. まだ有効化していない場合は「始める」をクリック

## ステップ 3: Google 認証を有効化

1. 「Sign-in method」タブをクリック
2. 「プロバイダを追加」または「Google」を探してクリック
3. 「有効にする」トグルをオンにする
4. **プロジェクトのサポートメールを選択**（重要）
   - ドロップダウンから自分のメールアドレスを選択
5. 「保存」をクリック

## ステップ 4: 承認済みドメインの確認

1. 「Settings」タブ（または「設定」タブ）をクリック
2. 「承認済みドメイン」セクションを確認
3. 開発中は以下のドメインが自動的に追加されているはずです：
   - `localhost`
   - `127.0.0.1`
   - Firebase Hosting のドメイン

## ステップ 5: 本番環境用の設定（Vercel へデプロイする場合）

Vercel にデプロイする場合は、承認済みドメインに Vercel のドメインを追加する必要があります：

1. 「承認済みドメイン」セクションで「ドメインを追加」をクリック
2. Vercel のドメインを入力（例: `your-app.vercel.app`）
3. 「追加」をクリック

## 完了

これで Google 認証が使えるようになりました！

開発サーバーを起動して動作確認してください：

```bash
npm run dev
```

ログイン画面で「Google でログイン」ボタンをクリックすると、Google アカウント選択画面が表示されます。

## トラブルシューティング

### エラー: "auth/popup-blocked"

- ブラウザのポップアップブロックを無効にしてください
- またはブラウザの設定で `localhost` を許可リストに追加してください

### エラー: "auth/unauthorized-domain"

- Firebase Console で承認済みドメインにアクセスしているドメインが追加されているか確認してください
- localhost の場合は自動的に追加されているはずですが、カスタムドメインの場合は手動で追加が必要です

### エラー: "auth/operation-not-allowed"

- Firebase Console で Google 認証が有効になっているか確認してください
- サポートメールが設定されているか確認してください



