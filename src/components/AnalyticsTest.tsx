'use client';

import { testAnalytics, logCustomEvent } from '../lib/firebase';

export const AnalyticsTest = () => {
  const handleTestClick = () => {
    console.log('Testing Analytics...');
    testAnalytics();
  };

  const handleCustomEventClick = () => {
    console.log('Sending custom event...');
    logCustomEvent('test_click', {
      button_name: 'test_button',
      page: 'analytics_test',
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #007bff', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      <h3>Firebase Analytics テスト</h3>
      <p>このセクションはFirebase Analyticsの動作確認用です。</p>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button 
          onClick={handleTestClick}
          style={{
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Analytics設定テスト
        </button>
        
        <button 
          onClick={handleCustomEventClick}
          style={{
            padding: '10px 15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          カスタムイベント送信
        </button>
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <p>📝 使用方法：</p>
        <ol>
          <li>ブラウザの開発者ツールを開く（F12）</li>
          <li>コンソールタブを選択</li>
          <li>上記のボタンをクリック</li>
          <li>コンソールに表示されるログを確認</li>
        </ol>
      </div>
    </div>
  );
};
