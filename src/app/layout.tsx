import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./style.css";
import UnifiedHeader from "./components/UnifiedHeader";
import UnifiedFooter from "./components/UnifiedFooter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PC商品一覧システム",
  description: "Firebase + Next.jsベースのPC商品一覧システム",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* 追加のNoindex設定（確実性のため） */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex, max-snippet:-1, max-image-preview:none, max-video-preview:-1" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex, max-snippet:-1, max-image-preview:none, max-video-preview:-1" />
        <meta name="bingbot" content="noindex, nofollow, noarchive, nosnippet, noimageindex, max-snippet:-1, max-image-preview:none, max-video-preview:-1" />
        <meta name="slurp" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta name="duckduckbot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
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