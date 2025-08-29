'use client';

import Link from 'next/link';

export default function UnifiedFooter() {
  return (
    <footer className="unified-footer">
      {/* サイト情報セクション */}
      <section className="site-info">
        <div className="info-links">
          <Link href="https://earbuds-plus.jp/company/about">
            運営会社
          </Link>
          <span className="separator">|</span>
          <Link href="https://earbuds-plus.jp/company/">
            会社概要
          </Link>
          <span className="separator">|</span>
          <Link href="https://earbuds-plus.jp/expert/">
            監修者一覧
          </Link>
          <span className="separator">|</span>
          <Link href="https://earbuds-plus.jp/privacy-policy/">
            プライバシーポリシー
          </Link>
          <span className="separator">|</span>
          <Link href="https://earbuds-plus.jp/sitemap/">
            サイトマップ
          </Link>
          <span className="separator">|</span>
          <Link href="https://earbuds-plus.jp/law/">
            特定商取引法に基づく表記
          </Link>
        </div>
        <div className="copyright">
          © イヤバズ＋.
        </div>
      </section>
    </footer>
  );
}
