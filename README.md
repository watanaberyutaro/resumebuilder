# AI履歴書ビルダー (AI Resume Builder)

AIを活用してプロ品質の履歴書・職務経歴書を自動生成するWebサービスです。企業からのスカウト（逆求人）機能も搭載しています。

## 機能概要

### 求職者向け機能
- **AI履歴書自動生成**: GPT-4o miniによる職務要約、自己PR、志望動機の自動生成
- **マルチステップフォーム**: 基本情報、職歴、スキルを段階的に入力
- **AIチャット編集**: 「もう少しカジュアルに」などの指示で文面を調整
- **PDF出力**: JIS形式の履歴書をPDFでダウンロード
- **証明写真加工**: 背景削除、トリミング、美肌補正（API抽象化済み）
- **スカウト受信**: 企業からのオファーを匿名で受け取り

### 企業向け機能
- **候補者検索**: 職種、スキル、経験年数でフィルタリング
- **スカウト送信**: 気になる候補者にオファーを送信
- **採用管理**: スカウトの返信状況を管理
- **成功報酬課金**: 採用決定時のみ1万円/人の課金

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + TypeScript
- **スタイリング**: Tailwind CSS
- **バックエンド/DB**: Supabase (Auth, PostgreSQL, Storage)
- **AI**: OpenAI GPT-4o mini
- **PDF生成**: @react-pdf/renderer
- **状態管理**: Zustand
- **フォーム**: React Hook Form + Zod
- **デプロイ**: Vercel

## プロジェクト構成

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # 認証関連ページ
│   │   ├── login/
│   │   └── register/
│   ├── (resume)/             # 求職者向けページ
│   │   ├── resume/           # 履歴書作成
│   │   ├── chat/             # AIチャット
│   │   ├── photo/            # 証明写真
│   │   ├── offers/           # スカウト一覧
│   │   └── settings/         # 設定
│   ├── (company)/            # 企業向けページ
│   │   └── company/
│   │       ├── dashboard/
│   │       ├── candidates/
│   │       ├── scouts/
│   │       └── billing/
│   └── api/                  # API Routes
│       ├── auth/callback/
│       ├── resume/
│       │   ├── generate/     # AI生成
│       │   ├── save/         # 保存
│       │   └── pdf/          # PDF出力
│       ├── chat/             # チャット
│       ├── photo/process/    # 画像処理
│       └── offers/           # スカウト
│           ├── send/
│           └── respond/
├── components/
│   ├── ui/                   # 共通UIコンポーネント
│   ├── resume/               # 履歴書フォーム
│   ├── layout/               # レイアウト
│   └── ...
├── lib/
│   ├── supabase/             # Supabaseクライアント
│   ├── openai/               # OpenAI連携
│   ├── photo/                # 画像処理（抽象化）
│   ├── notifications/        # 通知サービス
│   ├── billing/              # 課金サービス
│   ├── profile-import/       # プロフィールインポート
│   └── pdf/                  # PDF生成
├── store/                    # Zustand stores
├── types/                    # TypeScript型定義
└── i18n/                     # 多言語対応

supabase/
└── migrations/               # データベースマイグレーション
```

## セットアップ手順

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone <repository-url>
cd AI-ResumeBuilder
npm install
```

### 2. 環境変数の設定

`.env.local.example` を `.env.local` にコピーして、各値を設定:

```bash
cp .env.local.example .env.local
```

必要な環境変数:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# LINE (オプション)
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token

# アプリURL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabaseの設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. Authentication > Providersで以下を有効化:
   - Email/Password
   - Google OAuth (オプション)
3. SQL Editorでマイグレーションを実行:
   ```sql
   -- supabase/migrations/20241125000001_initial_schema.sql の内容を実行
   ```
4. Storage > Bucketsで `photos` バケットを作成（Public）

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリが起動します。

## 主要なAPIエンドポイント

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/resume/save` | POST | 履歴書の保存 |
| `/api/resume/generate` | POST | AI文章生成 |
| `/api/resume/pdf` | GET | PDF出力 |
| `/api/chat` | POST/GET | AIチャット |
| `/api/photo/process` | POST | 画像処理 |
| `/api/offers/send` | POST | スカウト送信 |
| `/api/offers/respond` | POST/PUT | スカウト回答/採用確定 |

## 料金モデル

### 求職者
- 履歴書1枚あたり: **¥110**（証明写真込み）
- AIコスト: 約2-3円/枚（GPT-4o mini）

### 企業
- スカウト送信: **無料**
- 採用成功報酬: **¥10,000/人**

## デプロイ

### Vercel

1. GitHubリポジトリをVercelにインポート
2. 環境変数を設定
3. デプロイ

```bash
vercel
```

## 開発ガイド

### 画像処理の拡張

`src/lib/photo/service-interface.ts` のインターフェースを実装することで、
別の画像処理APIに切り替え可能:

```typescript
export interface IPhotoEditService {
  removeBackground(imageBuffer: Buffer): Promise<PhotoProcessingResult>;
  replaceBackgroundWithSolidColor(imageBuffer: Buffer, color: string): Promise<PhotoProcessingResult>;
  cropToIDPhotoSize(imageBuffer: Buffer, size: IDPhotoSize, ...): Promise<PhotoProcessingResult>;
  applyBeautyFilter(imageBuffer: Buffer, intensity?: number): Promise<PhotoProcessingResult>;
  addSuitOverlay(imageBuffer: Buffer, suitType: string): Promise<PhotoProcessingResult>;
}
```

### 通知チャネルの追加

`src/lib/notifications/service.ts` を拡張して、
新しい通知チャネル（Slack、Discord等）を追加可能。

## ライセンス

Private - All Rights Reserved

## サポート

問題や質問がある場合は、Issueを作成してください。
