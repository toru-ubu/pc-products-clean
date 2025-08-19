import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../app/style.css";

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
        {/* 緑の帯（キャッチフレーズ） */}
        <div style={{
          width: '100%',
          backgroundColor: '#7a7a54',
          color: '#fff',
          padding: '4px 0',
          fontSize: '14px',
          fontWeight: 'normal'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingLeft: '20px',
            textAlign: 'left'
          }}>
            ゲーミングPCに関しての情報メディア
          </div>
        </div>
        
        {/* シンプルなヘッダー */}
        <header style={{
          width: '100%',
          padding: '20px 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderBottom: '1px solid #eee'
        }}>
          <a 
            href="https://earbuds-plus.jp/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textDecoration: 'none'
            }}
          >
            <img 
              src="/images/ear-buds-plus1575_450-.png" 
              alt="イヤバズ＋" 
              style={{
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '80px',
                display: 'block',
                cursor: 'pointer'
              }}
            />
          </a>
        </header>
        
        {/* メインコンテンツ */}
        <main>
          {children}
        </main>
        
        {/* フッター */}
        <footer style={{
          width: '100%',
          backgroundColor: '#f8f8f8',
          borderTop: '1px solid #e0e0e0',
          padding: '20px 0',
          marginTop: '40px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            {/* フッターナビゲーション */}
            <nav style={{
              marginBottom: '15px'
            }}>
              <a 
                href="https://earbuds-plus.jp/owner/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#666',
                  fontSize: '14px',
                  margin: '0 10px',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                運営者情報
              </a>
              <span style={{
                color: '#ccc',
                margin: '0 5px'
              }}>|</span>
              <a 
                href="https://earbuds-plus.jp/privacy-policy/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#666',
                  fontSize: '14px',
                  margin: '0 10px',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                プライバシーポリシー
              </a>
              <span style={{
                color: '#ccc',
                margin: '0 5px'
              }}>|</span>
              <a 
                href="https://earbuds-plus.jp/sitemap/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#666',
                  fontSize: '14px',
                  margin: '0 10px',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                サイトマップ
              </a>
              <span style={{
                color: '#ccc',
                margin: '0 5px'
              }}>|</span>
              <a 
                href="https://earbuds-plus.jp/law/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#666',
                  fontSize: '14px',
                  margin: '0 10px',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                特定商取引法に基づく表記
              </a>
            </nav>
            
            {/* コピーライト */}
            <p style={{
              color: '#666',
              fontSize: '14px',
              margin: '0',
              textAlign: 'center'
            }}>
              © イヤバズ＋.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}