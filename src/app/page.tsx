import Link from 'next/link';
import { FileText, Sparkles, Users, Shield, Zap, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 max-w-6xl">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">AI履歴書ビルダー</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              無料で始める
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            AIが作る、<br />
            <span className="text-blue-600">プロ品質の履歴書</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            経歴情報を入力するだけで、GPT-4o miniが自然で説得力のある
            履歴書・職務経歴書を自動生成。企業からのスカウトも受け取れます。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              無料で履歴書を作成
            </Link>
            <Link
              href="/register?type=company"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              企業の方はこちら
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12">主な機能</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI自動生成</h3>
            <p className="text-gray-600">
              職務要約、自己PR、志望動機をAIが自動生成。
              チャットで微調整も可能です。
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">スカウト機能</h3>
            <p className="text-gray-600">
              匿名プロフィールで企業からのスカウトを受信。
              気になる企業とだけ連絡できます。
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">プライバシー保護</h3>
            <p className="text-gray-600">
              現職企業をブロック設定可能。
              あなたの転職活動を安全に守ります。
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">使い方</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: '情報入力', desc: '基本情報と職歴を入力' },
              { step: '2', title: 'AI生成', desc: '職務要約・自己PRを自動作成' },
              { step: '3', title: '編集・調整', desc: 'チャットで文面を微調整' },
              { step: '4', title: 'PDF出力', desc: '完成した履歴書をダウンロード' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20 max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12">料金プラン</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold mb-2">求職者向け</h3>
            <div className="text-4xl font-bold mb-4">
              ¥110<span className="text-lg text-gray-500 font-normal">/枚</span>
            </div>
            <ul className="space-y-3 text-gray-600 mb-6">
              <li className="flex items-center">
                <Zap className="h-5 w-5 text-green-500 mr-2" />
                AI履歴書生成
              </li>
              <li className="flex items-center">
                <Zap className="h-5 w-5 text-green-500 mr-2" />
                PDF出力
              </li>
              <li className="flex items-center">
                <Zap className="h-5 w-5 text-green-500 mr-2" />
                チャット編集
              </li>
              <li className="flex items-center">
                <Zap className="h-5 w-5 text-green-500 mr-2" />
                スカウト受信
              </li>
            </ul>
            <Link
              href="/register"
              className="block text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              今すぐ始める
            </Link>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold mb-2">企業向け</h3>
            <div className="text-4xl font-bold mb-4">
              ¥10,000<span className="text-lg text-gray-500 font-normal">/採用</span>
            </div>
            <ul className="space-y-3 text-gray-600 mb-6">
              <li className="flex items-center">
                <Zap className="h-5 w-5 text-green-500 mr-2" />
                候補者検索
              </li>
              <li className="flex items-center">
                <Zap className="h-5 w-5 text-green-500 mr-2" />
                スカウト送信無制限
              </li>
              <li className="flex items-center">
                <Zap className="h-5 w-5 text-green-500 mr-2" />
                採用成功時のみ課金
              </li>
              <li className="flex items-center">
                <Globe className="h-5 w-5 text-green-500 mr-2" />
                初期費用・月額費用なし
              </li>
            </ul>
            <Link
              href="/register?type=company"
              className="block text-center border border-blue-600 text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              企業登録する
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <FileText className="h-6 w-6" />
              <span className="font-bold">AI履歴書ビルダー</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link href="/terms" className="hover:text-white">利用規約</Link>
              <Link href="/privacy" className="hover:text-white">プライバシーポリシー</Link>
              <Link href="/contact" className="hover:text-white">お問い合わせ</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            © 2024 AI履歴書ビルダー. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
