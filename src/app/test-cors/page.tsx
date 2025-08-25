'use client';

import { useState } from 'react';

export default function TestCorsPage() {
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    success: boolean;
    result?: unknown;
    error?: string;
    timestamp: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : 'https://pc-products-clean-r04pbpaas-toru-ubus-projects.vercel.app';

  const runTest = async (testName: string, testFunction: () => Promise<unknown>) => {
    setIsLoading(true);
    try {
      console.log(`Running test: ${testName}`);
      const result = await testFunction();
      setTestResults(prev => [...prev, {
        name: testName,
        success: true,
        result,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error(`Test failed: ${testName}`, error);
      setTestResults(prev => [...prev, {
        name: testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const testCorsGet = () => 
    fetch(`${baseUrl}/api/test-cors`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());

  const testCorsPost = () => 
    fetch(`${baseUrl}/api/test-cors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'data', timestamp: Date.now() })
    }).then(res => res.json());

  const testProductsApi = () => 
    fetch(`${baseUrl}/api/products?limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());

  const testProxyApi = () => 
    fetch(`${baseUrl}/api/proxy?limit=3&format=json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen p-8" style={{ background: '#f5f5f5' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          CORS設定テストページ
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">テスト実行</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => runTest('CORS GET Test', testCorsGet)}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              CORS GET テスト
            </button>
            
            <button
              onClick={() => runTest('CORS POST Test', testCorsPost)}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              CORS POST テスト
            </button>
            
            <button
              onClick={() => runTest('Products API Test', testProductsApi)}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              商品API テスト
            </button>
            
            <button
              onClick={() => runTest('Proxy API Test', testProxyApi)}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              プロキシAPI テスト
            </button>
          </div>
          
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            結果をクリア
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">テスト結果</h2>
          
          {testResults.length === 0 ? (
            <p className="text-gray-500">テストを実行してください</p>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded border ${
                    result.success 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.name}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.success 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {result.success ? '成功' : '失敗'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {result.timestamp}
                  </p>
                  
                  {result.success ? (
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-red-600 text-sm">
                      エラー: {result.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            使用方法
          </h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• 各テストボタンをクリックしてCORS設定を確認</li>
            <li>• 成功/失敗の結果が表示されます</li>
            <li>• 開発環境では全てのドメインからのアクセスを許可</li>
            <li>• 本番環境では https://earbuds-plus.jp のみ許可</li>
            <li>• プロキシ統合用のAPIも含まれています</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
