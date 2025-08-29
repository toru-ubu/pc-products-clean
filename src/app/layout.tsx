import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./style.css";
import UnifiedHeader from "./components/UnifiedHeader";
import UnifiedFooter from "./components/UnifiedFooter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "日本最大級のゲーミングPC検索ツール「イヤバズnavi」",
  description: "スペックや価格でゲーミングPCを横断検索！公式サイトの最新セール価格も反映されるから、比較も購入もスムーズに。",
  // ファビコン設定
  icons: {
    icon: '/db/images/earbuds-plus_favicon.png',
    shortcut: '/db/images/earbuds-plus_favicon.png',
    apple: '/db/images/earbuds-plus_favicon.png',
  },
  // Noindex設定を追加
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noimageindex: true,
    nosnippet: true,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nosnippet: true,
      noarchive: true,
    },
  },
  // OGP設定を追加
  openGraph: {
    title: "日本最大級のゲーミングPC検索ツール「イヤバズnavi」",
    description: "スペックや価格でゲーミングPCを横断検索！公式サイトの最新セール価格も反映されるから、比較も購入もスムーズに。",
    type: "website",
    url: "https://pc-products-clean.vercel.app/db/",
    siteName: "イヤバズnavi",
    images: [
      {
        url: "https://pc-products-clean.vercel.app/db/images/earbuds_kidukeba (1).png",
        width: 1200,
        height: 630,
        alt: "イヤバズnavi - ゲーミングPC検索ツール"
      }
    ]
  },
  // Twitter Card設定
  twitter: {
    card: "summary_large_image",
    title: "日本最大級のゲーミングPC検索ツール「イヤバズnavi」",
    description: "スペックや価格でゲーミングPCを横断検索！公式サイトの最新セール価格も反映されるから、比較も購入もスムーズに。",
    images: ["https://pc-products-clean.vercel.app/db/images/earbuds_kidukeba (1).png"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* ファビコン設定 */}
        <link rel="icon" href="/db/images/earbuds-plus_favicon.png" />
        <link rel="shortcut icon" href="/db/images/earbuds-plus_favicon.png" />
        <link rel="apple-touch-icon" href="/db/images/earbuds-plus_favicon.png" />
        
        {/* 追加のNoindex設定（確実性のため） */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex, max-snippet:-1, max-image-preview:none, max-video-preview:-1" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex, max-snippet:-1, max-image-preview:none, max-video-preview:-1" />
        <meta name="bingbot" content="noindex, nofollow, noarchive, nosnippet, noimageindex, max-snippet:-1, max-image-preview:none, max-video-preview:-1" />
        <meta name="slurp" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta name="duckduckbot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        
        {/* ASP アフィリエイトリンク自動変換タグ */}
        {/* ValueCommerce */}
        <script type="text/javascript" language="javascript" dangerouslySetInnerHTML={{
          __html: `var vc_pid = "889341774";`
        }}></script>
        <script type="text/javascript" src="//aml.valuecommerce.com/vcdal.js" async></script>
        
        {/* Site Lead */}
        <script async type="text/javascript" charset="utf-8" src="https://client.sitelead.net/common.js?service-token=964ad2db79f2a1ca2158de790fdfcd1251eef658"></script>
        
        {/* A8 Site manager */}
        <script src="//statics.a8.net/a8link/a8linkmgr.js"></script>
        <script dangerouslySetInnerHTML={{
          __html: `a8linkmgr({
            "config_id": "05CxIytfdoZN8Eg6FFAy"
          });`
        }}></script>
      </head>
      <body className={inter.className}>
        {/* イヤバズ+統一ヘッダー */}
        <UnifiedHeader />
        {/* メインコンテンツのみ（プロキシ統合用） */}
        <main>
          {children}
        </main>
        {/* イヤバズ+統一フッター */}
        <UnifiedFooter />
      </body>
    </html>
  );
}