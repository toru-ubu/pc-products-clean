'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function UnifiedHeader() {
  return (
    <header className="unified-header">
      <div className="l-header__inner l-container">
        {/* ロゴエリア */}
        <div className="l-header__logo">
          <div className="c-headLogo -img">
            <Link 
              href="https://earbuds-plus.jp/" 
              title="イヤバズ+" 
              className="c-headLogo__link" 
              rel="home"
            >
              <Image
                src="/images/ear-buds-plus1575_450-.png"
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
