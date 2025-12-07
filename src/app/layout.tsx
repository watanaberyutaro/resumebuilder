import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI履歴書ビルダー - プロ品質の履歴書をAIで作成',
  description: 'GPT-4o miniを活用して、職務要約・自己PR・志望動機を自動生成。企業からのスカウトも受け取れる履歴書作成サービス。',
  keywords: ['履歴書', '職務経歴書', 'AI', '転職', 'スカウト', '自動生成'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
