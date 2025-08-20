import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f5' }}>
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          イヤバズDB
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Firebase + Next.jsベースのPC商品検索システム
        </p>
        
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            設計ドキュメントに基づいて作成されたクリーンな実装版です。<br />
            既存のWordPressサイトのCSS/HTMLを完全移植し、<br />
            シンプルで管理しやすい構造を目指しています。
          </p>
        </div>
        
        <div className="mt-12">
          <Link 
            href="/products"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            商品一覧を見る
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>
            技術スタック: Next.js 15, React 19, TypeScript, Firebase Firestore, Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}