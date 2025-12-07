# Google認証セットアップガイド

このガイドでは、AI Resume BuilderでGoogleログイン機能を有効にする手順を説明します。

## 📋 必要なステップ

1. Google Cloud Consoleでの設定
2. SupabaseダッシュボードでのOAuth設定
3. データベースマイグレーションの適用
4. 動作確認

---

## 1️⃣ Google Cloud Consoleでの設定

### OAuth 2.0 クライアントIDの作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択または新規作成
3. 左メニューから「APIとサービス」→「認証情報」を選択
4. 「認証情報を作成」→「OAuth クライアント ID」をクリック

### 同意画面の設定（初回のみ）

OAuth同意画面が未設定の場合：
1. 「OAuth同意画面を構成」をクリック
2. User Type: 「外部」を選択（個人開発の場合）
3. アプリ情報を入力：
   - アプリ名: AI Resume Builder
   - ユーザーサポートメール: あなたのメールアドレス
   - デベロッパーの連絡先情報: あなたのメールアドレス
4. スコープは追加不要（デフォルトのまま）
5. テストユーザーは必要に応じて追加
6. 「保存して次へ」で完了

### OAuth クライアントIDの作成

1. 「認証情報」タブに戻る
2. 「認証情報を作成」→「OAuth クライアント ID」
3. アプリケーションの種類：「ウェブアプリケーション」
4. 名前：AI Resume Builder（任意）

### リダイレクトURIの設定

「承認済みのリダイレクト URI」に以下を追加：

**開発環境：**
```
http://localhost:3000/api/auth/callback
```

**Supabase（必須）：**
```
https://boxltrhzwoplvccewiub.supabase.co/auth/v1/callback
```

**本番環境（デプロイ後）：**
```
https://YOUR-DOMAIN.com/api/auth/callback
```

7. 「作成」をクリック
8. **クライアントIDとクライアントシークレットが表示されるのでコピー**（後で使用）

---

## 2️⃣ Supabaseダッシュボードでの設定

### Google Providerの有効化

1. [Supabase Dashboard](https://app.supabase.com/)にアクセス
2. プロジェクト（boxltrhzwoplvccewiub）を選択
3. 左メニューから「Authentication」→「Providers」を選択
4. プロバイダー一覧から「Google」を探してクリック

### 設定の入力

5. **Enable Sign in with Google**をONにする
6. Google Cloud Consoleでコピーした情報を入力：
   - **Client ID (for OAuth)**: [Google Cloud ConsoleのクライアントID]
   - **Client Secret (for OAuth)**: [Google Cloud Consoleのクライアントシークレット]
7. 「Save」ボタンをクリック

### Callback URLの確認

設定画面に表示される「Callback URL (for OAuth)」をメモ：
```
https://boxltrhzwoplvccewiub.supabase.co/auth/v1/callback
```

このURLがGoogle Cloud Consoleの「承認済みのリダイレクトURI」に含まれているか確認してください。

---

## 3️⃣ データベースマイグレーションの適用

OAuth認証時のユーザー情報を適切に処理するためのマイグレーションを適用します。

### Supabase Dashboard経由（推奨）

1. [Supabase Dashboard](https://app.supabase.com/)でプロジェクトを開く
2. 左メニューから「SQL Editor」を選択
3. 「New query」をクリック
4. 以下のファイルの内容をコピー＆ペースト：
   ```
   supabase/migrations/20251207_improve_oauth_handling.sql
   ```
5. 「Run」ボタンをクリックして実行
6. 成功メッセージ「✅ OAuth handling improved!」が表示されることを確認

### ローカル（Supabase CLIを使用する場合）

```bash
# Supabaseプロジェクトにリンク（初回のみ）
npx supabase link --project-ref boxltrhzwoplvccewiub

# マイグレーションを適用
npx supabase db push
```

---

## 4️⃣ 動作確認

### テストの手順

1. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

2. **ログインページにアクセス**
   - URL: http://localhost:3000/login
   - 「Googleでログイン」ボタンが表示されることを確認

3. **Google認証をテスト**
   - 「Googleでログイン」ボタンをクリック
   - Googleのログイン画面にリダイレクトされる
   - Googleアカウントでログイン
   - アプリへのアクセス許可を求められたら「許可」
   - ダッシュボード（/dashboard）にリダイレクトされる

4. **プロファイルの確認**
   - Supabase Dashboardで「Table Editor」→「profiles」を開く
   - 新しいユーザーが作成されていることを確認
   - `display_name`にGoogleアカウントの名前が設定されているか確認
   - `avatar_url`にGoogleのプロフィール画像URLが設定されているか確認

5. **履歴書の確認（個人ユーザーの場合）**
   - 「Table Editor」→「resumes」を開く
   - OAuth認証で登録したユーザーの初期履歴書が自動作成されているか確認

### 登録ページでもテスト

1. **登録ページにアクセス**
   - URL: http://localhost:3000/register
   - 「Googleで登録」ボタンが表示されることを確認

2. **Google認証をテスト**
   - 同様の手順でテスト

---

## ❗ トラブルシューティング

### エラー: "redirect_uri_mismatch"

**原因**: Google Cloud ConsoleのリダイレクトURIが正しく設定されていない

**解決策**:
1. Google Cloud Consoleの「認証情報」を確認
2. OAuth 2.0 クライアントIDの設定を開く
3. 「承認済みのリダイレクトURI」に以下が含まれているか確認：
   - `http://localhost:3000/api/auth/callback`（開発環境）
   - `https://boxltrhzwoplvccewiub.supabase.co/auth/v1/callback`（Supabase）

### エラー: "Invalid Credentials"

**原因**: SupabaseのClient IDまたはClient Secretが間違っている

**解決策**:
1. Google Cloud Consoleで正しい値を再確認
2. Supabase Dashboard → Authentication → Providers → Googleで再入力
3. 保存後、ブラウザのキャッシュをクリア

### ログイン後にプロファイルが作成されない

**原因**: データベーストリガーが正しく動作していない

**解決策**:
1. マイグレーション`20251207_improve_oauth_handling.sql`が適用されているか確認
2. Supabase Dashboard → SQL Editorで以下のクエリを実行：
   ```sql
   SELECT * FROM information_schema.triggers
   WHERE trigger_name = 'on_auth_user_created';
   ```
3. トリガーが存在しない場合、マイグレーションを再実行

### OAuth認証後に認証エラーが表示される

**原因**: コールバック処理でエラーが発生している

**解決策**:
1. ブラウザの開発者ツールでコンソールエラーを確認
2. Supabase Dashboard → Logsでエラーログを確認
3. `src/app/api/auth/callback/route.ts`のコードを確認

---

## ✅ チェックリスト

設定が完了したら、以下を確認してください：

- [ ] Google Cloud ConsoleでOAuth 2.0クライアントIDを作成
- [ ] リダイレクトURIに開発環境とSupabaseのURLを追加
- [ ] Supabase DashboardでGoogle Providerを有効化
- [ ] Client IDとClient Secretを正しく入力
- [ ] データベースマイグレーションを適用
- [ ] ログインページでGoogleログインボタンが表示される
- [ ] 登録ページでGoogleログインボタンが表示される
- [ ] Google認証が正常に動作する
- [ ] 認証後にプロファイルと履歴書が自動作成される

---

## 📝 注意事項

1. **本番環境へのデプロイ時**
   - Google Cloud ConsoleのリダイレクトURIに本番URLを追加
   - 環境変数が正しく設定されているか確認

2. **セキュリティ**
   - Client SecretはGitにコミットしない（Supabase側で管理）
   - 本番環境では必ずHTTPSを使用

3. **制限事項**
   - Google OAuth同意画面が「テスト」モードの場合、追加したテストユーザーのみログイン可能
   - 一般公開する場合は「公開」モードに変更する必要がある（Google審査が必要な場合あり）

---

## 🎉 完了！

これでGoogleログイン機能が正しく動作するはずです。
何か問題が発生した場合は、上記のトラブルシューティングセクションを参照してください。
