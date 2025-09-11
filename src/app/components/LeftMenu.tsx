'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function LeftMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hamburgerTop, setHamburgerTop] = useState<number>(8);
  const [pcTop, setPcTop] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // SPドロワー開閉時に背景スクロールを抑制
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // SP時にヘッダー高さの中央に配置
  useEffect(() => {
    const calcTop = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth > 768) return; // SPのみ
      const header = document.querySelector('.unified-header') as HTMLElement | null;
      const headerHeight = header?.offsetHeight || 56;
      const buttonSize = 44;
      const top = Math.max(4, Math.round((headerHeight - buttonSize) / 2));
      setHamburgerTop(top);
    };
    calcTop();
    window.addEventListener('resize', calcTop);
    return () => window.removeEventListener('resize', calcTop);
  }, []);

  // PCメニューのtopをフィルター領域上端に合わせる（ヘッダー基準）
  useLayoutEffect(() => {
    const getAnchorEl = (): HTMLElement | null => {
      return (
        (document.querySelector('.filter-controls') as HTMLElement | null) ||
        (document.querySelector('.results-title') as HTMLElement | null) ||
        (document.querySelector('.products-container') as HTMLElement | null)
      );
    };

    const calcPcTop = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 1280) return; // PC表示時のみ
      const header = document.querySelector('.unified-header') as HTMLElement | null;
      const anchor = getAnchorEl();
      if (header && anchor) {
        // ビューポートのスクロール位置を考慮した相対位置
        const headerTop = header.getBoundingClientRect().top + window.scrollY;
        const anchorTop = anchor.getBoundingClientRect().top + window.scrollY;
        const relativeTop = Math.round(anchorTop - headerTop);
        const extraOffset = 12; // アンカーより少し下げる
        const top = Math.max(60, relativeTop + extraOffset);
        setPcTop(top);
      } else {
        setPcTop(180);
      }
    };
    // 初回はレイアウト確定後のタイミングで実行（ペイント前/直後の両方）
    calcPcTop();
    const raf = requestAnimationFrame(calcPcTop);
    const t1 = setTimeout(calcPcTop, 120);
    const t2 = setTimeout(calcPcTop, 400);

    // フィルター領域サイズ変化に追随
    const anchorEl = (() => {
      const el = document.querySelector('.filter-controls') || document.querySelector('.results-title') || document.querySelector('.products-container');
      return el as HTMLElement | null;
    })();
    const ro = (typeof ResizeObserver !== 'undefined' && anchorEl)
      ? new ResizeObserver(() => calcPcTop())
      : null;
    if (ro && anchorEl) ro.observe(anchorEl);

    // リサイズ/戻る（bfcache）/ロード
    window.addEventListener('resize', calcPcTop);
    window.addEventListener('load', calcPcTop);
    window.addEventListener('pageshow', calcPcTop);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1); clearTimeout(t2);
      if (ro && anchorEl) ro.unobserve(anchorEl);
      window.removeEventListener('resize', calcPcTop);
      window.removeEventListener('load', calcPcTop);
      window.removeEventListener('pageshow', calcPcTop);
    };
  }, []);

  return (
    <>
      {/* PC固定メニュー（幅≥1280pxで表示） */}
      <nav
        className="left-menu left-menu--pc"
        aria-label="サイドメニュー"
        style={pcTop !== null ? { top: pcTop } : undefined}
      >
        <div className="left-menu__title">MENU</div>
        <ul>
          <li>
            <Link href="https://earbuds-plus.jp/db" className="left-menu__link">TOP</Link>
          </li>
          <li>
            <Link href="https://earbuds-plus.jp/db/search" className="left-menu__link">商品検索</Link>
          </li>
          <li>
            <Link href="/saved" className="left-menu__link">保存した商品</Link>
          </li>
        </ul>
        <div className="left-menu__legal" aria-label="サイト情報">
          <Link href="https://earbuds-plus.jp/company/about" className="left-menu__legalLink">運営会社</Link>
          <span className="left-menu__legalSep">・</span>
          <Link href="https://earbuds-plus.jp/privacy-policy/" className="left-menu__legalLink">プライバシーポリシー</Link>
          <span className="left-menu__legalSep">・</span>
          <Link href="https://earbuds-plus.jp/law/" className="left-menu__legalLink">特定商取引法に基づく表記</Link>
        </div>
      </nav>

      {/* SPハンバーガー（左上固定） */}
      <button
        type="button"
        aria-label="メニュー"
        className="hamburger-btn"
        onClick={() => setOpen(prev => !prev)}
        style={mounted ? { top: hamburgerTop } : undefined}
      >
        <span className="hamburger-icon" />
      </button>
      {/* SPではラベルは表示しない（アイコンのみ） */}

      {/* SPドロワー */}
      {open && (
        <>
          <div className="drawer-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="drawer-panel" role="dialog" aria-modal="true" aria-label="メニュー">
            <nav className="drawer-nav">
              <ul>
                <li>
                  <Link href="https://earbuds-plus.jp/db" className="left-menu__link" onClick={() => setOpen(false)}>TOP</Link>
                </li>
                <li>
                  <Link href="https://earbuds-plus.jp/db/search" className="left-menu__link" onClick={() => setOpen(false)}>商品検索</Link>
                </li>
                <li>
                  <Link href="/saved" className="left-menu__link" onClick={() => setOpen(false)}>保存した商品</Link>
                </li>
              </ul>
              <div className="left-menu__legal" aria-label="サイト情報">
                <Link href="https://earbuds-plus.jp/company/about" className="left-menu__legalLink" onClick={() => setOpen(false)}>運営会社</Link>
                <span className="left-menu__legalSep">・</span>
                <Link href="https://earbuds-plus.jp/privacy-policy/" className="left-menu__legalLink" onClick={() => setOpen(false)}>プライバシーポリシー</Link>
                <span className="left-menu__legalSep">・</span>
                <Link href="https://earbuds-plus.jp/law/" className="left-menu__legalLink" onClick={() => setOpen(false)}>特定商取引法に基づく表記</Link>
              </div>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}


