import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./style.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PC商品一覧システム",
  description: "Firebase + Next.jsベースのPC商品一覧システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* メインコンテンツのみ（プロキシ統合用） */}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}