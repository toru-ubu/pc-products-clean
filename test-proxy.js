const http = require('http');
const httpProxy = require('http-proxy-middleware');
const express = require('express');

const app = express();

// /db/ で始まるパスを localhost:3000 に転送（パス変換あり）
app.use('/db', httpProxy.createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/db': '', // /db を削除
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`プロキシ: ${req.url} → http://localhost:3000${req.url.replace('/db', '')}`);
  }
}));

// その他のパスは何もしない（404）
app.use('*', (req, res) => {
  res.status(404).send('Not Found');
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`\n🔥 テストプロキシサーバー起動: http://localhost:${PORT}`);
  console.log(`\n📋 テスト手順:`);
  console.log(`1. Next.js開発サーバー: http://localhost:3000 (起動済み)`);
  console.log(`2. プロキシ経由アクセス: http://localhost:${PORT}/db/`);
  console.log(`3. 期待結果: 商品一覧ページが表示される\n`);
});
