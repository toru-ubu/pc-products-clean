'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function UnifiedHeader() {
  const pathname = usePathname();
  const isDbRootPage = pathname === '/' && !pathname.startsWith('/search');

  return (
    <header className="unified-header">
      <div className="l-header__inner l-container">
        {/* 中央のロゴエリア */}
        <div className="l-header__logo">
          <div className="c-headLogo -img">
            <Link 
              href="https://earbuds-plus.jp/db" 
              title="イヤバズ+" 
              className="c-headLogo__link" 
              rel="home"
            >
              <Image
                src="/db/images/earbuds_kidukeba (1).png"
                alt="イヤバズ（テストサイト）"
                width={1575}
                height={450}
                className="c-headLogo__img"
                priority
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
