'use client';

import { useState } from 'react';

export default function WidgetPage() {
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">イヤバズnavi ウィジェット プレビュー</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">WordPress埋め込み用ウィジェット</h2>
          <p className="text-gray-600 mb-4">
            以下のHTMLコードをWordPressのカスタムHTMLブロックに貼り付けてください。
          </p>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
{`<div id="earbuds-widget-container">
  <!-- ウィジェットコンテンツ -->
</div>
<link rel="stylesheet" href="https://pc-products-clean.vercel.app/widgets/welcome-widget.css">
<script src="https://pc-products-clean.vercel.app/widgets/welcome-widget.js"></script>`}
            </pre>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-4">ウィジェットプレビュー</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div id="earbuds-widget-container">
              {/* ウィジェットコンテンツ */}
            </div>
          </div>
        </div>

        {/* ウィジェットのCSSとJSを読み込み */}
        <link rel="stylesheet" href="/widgets/welcome-widget.css" />
        <script 
          src="/widgets/welcome-widget.js" 
          onLoad={() => setIsWidgetLoaded(true)}
        />
      </div>
    </div>
  );
}
