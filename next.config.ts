import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/db', // Cloudflare統合用のベースパス設定

  // ESLintの警告をエラーにしない
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScriptの型チェックを無効にする
  typescript: {
    ignoreBuildErrors: true,
  },

  async headers() {
    return [
      {
        // APIルートに対するCORS設定（ベースパス適用後）
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' 
              ? '*' 
              : 'https://earbuds-plus.jp'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          }
        ]
      }
    ];
  },

};

export default nextConfig;
