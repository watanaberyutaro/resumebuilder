# Google認証の設定手順

## 1. Google Cloud Consoleでの設定

### OAuth 2.0 クライアントIDの作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択または新規作成
3. 左メニューから「APIとサービス」→「認証情報」を選択
4. 「認証情報を作成」→「OAuth クライアント ID」をクリック
5. アプリケーションの種類：「ウェブアプリケーション」を選択
6. 名前：任意の名前（例：AI Resume Builder）

### リダイレクトURIの設定

7. 「承認済みのリダイレクト URI」に以下を追加：
   - 開発環境：`http://localhost:3000/api/auth/callback`
   - 本番環境：`https://YOUR-DOMAIN.com/api/auth/callback`
   - Supabase：`https://boxltrhzwoplvccewiub.supabase.co/auth/v1/callback`

8. 「作成」ボタンをクリック
9. クライアントIDとクライアントシークレットをコピー

## 2. Supabase Dashboardでの設定

1. [Supabase Dashboard](https://app.supabase.com/)にアクセス
2. プロジェクト（boxltrhzwoplvccewiub）を選択
3. 左メニューから「Authentication」→「Providers」を選択
4. 「Google」を探してクリック
5. 「Enable Sign in with Google」をONにする
6. Google Cloud Consoleでコピーした情報を入力：
   - **Client ID**: Google Cloud Consoleのクライアント ID
   - **Client Secret**: Google Cloud Consoleのクライアントシークレット
7. 「Save」ボタンをクリック

## 3. リダイレクトURLの確認

Supabaseの設定画面で表示される「Callback URL」をコピーして、
Google Cloud Consoleの承認済みリダイレクトURIに追加されていることを確認してください。

通常は以下のような形式です：
```
https://boxltrhzwoplvccewiub.supabase.co/auth/v1/callback
```

## 4. 設定完了後

設定が完了したら、アプリケーションでGoogleログインボタンをクリックして動作確認を行ってください。

### トラブルシューティング

- **エラー: redirect_uri_mismatch**
  → Google Cloud ConsoleのリダイレクトURIが正しく設定されているか確認

- **エラー: 無効な認証情報**
  → SupabaseのClient IDとClient Secretが正しく入力されているか確認

- **ログイン後にプロファイルが作成されない**
  → データベーストリガーとプロファイルテーブルの設定を確認
