'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSavedItems } from '../../context/SavedItemsContext';
import { Product } from '../../lib/firebase';
import { LoadingSpinner } from '../../components/LoadingSpinner';

function SavedListContent() {
  const { savedItems } = useSavedItems();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // searchと同じ価格/バッジ表現に合わせるためのモバイル判定（必ず最上位で呼ぶ）
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const idToSavedAt = useMemo(() => {
    const map = new Map<string, string>();
    savedItems.forEach(i => map.set(i.productId, i.savedAt));
    return map;
  }, [savedItems]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set('limit', '5000');
        const res = await fetch(`/db/api/products?${params.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const all: Product[] = data?.products || [];
        const idSet = new Set(savedItems.map(s => s.productId));
        const filtered = all.filter(p => idSet.has(p.id));
        // 新しい保存順（savedAt desc）で並べる
        filtered.sort((a, b) => {
          const sa = idToSavedAt.get(a.id) || '';
          const sb = idToSavedAt.get(b.id) || '';
          return sb.localeCompare(sa);
        });
        setProducts(filtered);
      } catch (e) {
        setError('保存した商品の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [savedItems, idToSavedAt]);

  if (loading) {
    return <LoadingSpinner type="data" />;
  }

  if (error) {
    return (
      <div className="products-container">
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 font-semibold">{error}</div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="products-container page-min-height">
        <h1 className="results-title">保存した商品一覧</h1>
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">保存された商品はありません。</div>
          <div className="text-gray-500 text-xs mb-2">
            ※保存しているのに表示されない場合は、{isMobile && <br />}ページリロードをお試しください。
          </div>
          <a href="https://earbuds-plus.jp/db/search" className="mt-2 inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">商品検索画面に戻る</a>
        </div>
      </div>
    );
  }


  const ProductCard = ({ product }: { product: Product }) => {
    const { isSaved, toggleSaved } = useSavedItems();
    const saved = isSaved(product.id);
    return (
    <a href={product.productUrl} target="_blank" rel="nofollow sponsored" className="product-card">
      <div className="card-content">
        {/* PC: カード左上 保存ボタン（実機能付き） */}
        <SavedToggle productId={product.id} />
        {/* SP表示用：商品名・メーカーヘッダー */}
        <div className="card-header">
          <strong>{product.name}</strong>
          <span className="maker-name">{product.maker}</span>
        </div>

        {/* 画像+情報ブロック */}
        <div className="card-body">
          {/* 商品画像 */}
          <div className="card-image">
            <img src={product.imageUrl} alt={product.name} />
          </div>

          {/* 商品情報 */}
          <div className="card-info">
            {/* PC表示用：商品名・メーカー（SP表示では非表示にする） */}
            <div className="pc-only-header">
              <strong>{product.name}</strong>
              <span className="maker-name">{product.maker}</span>
            </div>

            {/* スペック情報 */}
            <div className="spec-info">
              <div className="spec-item">
                <div className="spec-label">CPU</div>
                <div className="spec-value">{product.cpu || '情報なし'}</div>
              </div>
              <div className="spec-item">
                <div className="spec-label">GPU</div>
                <div className="spec-value">{product.gpu || '情報なし'}</div>
              </div>
              <div className="spec-item">
                <div className="spec-label">メモリ</div>
                <div className="spec-value">{product.memory || '情報なし'}</div>
              </div>
              <div className="spec-item">
                <div className="spec-label">ストレージ</div>
                <div className="spec-value">{product.storage || '情報なし'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 価格ブロック（searchの表現に合わせ） */}
        <div className="price-block">
          {product.discountrate > 0 ? (
            <>
              {isMobile ? (
                <div className="sale-price-container">
                  {product.price > product.effectiveprice && (
                    <>
                      <div className="discount-rate-row">
                        <span className={`discount-rate-badge-sp ${(() => {
                          const rate = product.discountrate;
                          if (rate >= 30) return 'discount-high';
                          else if (rate >= 10) return 'discount-mid';
                          else return 'discount-low';
                        })()}`}>
                          {product.discountrate}%OFF
                        </span>
                      </div>
                      <div className="price-row">
                        <span className="original-price-inline">
                          <span className="list-price-strikethrough">¥{product.price.toLocaleString()}</span>
                        </span>
                        <span className="actual-price-inline">
                          <span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  {product.price <= product.effectiveprice && (
                    <div className="discount-actual-row">
                      <span className={`discount-rate-badge-sp ${(() => {
                        const rate = product.discountrate;
                        if (rate >= 30) return 'discount-high';
                        else if (rate >= 10) return 'discount-mid';
                        else return 'discount-low';
                      })()}`}>
                        {product.discountrate}%OFF
                      </span>
                      <span className="actual-price-inline">
                        <span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="sale-price-container">
                  {product.price > product.effectiveprice && (
                    <>
                      <div className="original-price-row">
                        <span className="original-price-inline">
                          <span className="tax-included-small">税込</span><span className="list-price-strikethrough">¥{product.price.toLocaleString()}</span>
                        </span>
                      </div>
                      <div className="discount-actual-row">
                        <span className={`discount-rate-inline ${(() => {
                          const rate = product.discountrate;
                          if (rate >= 30) return 'discount-high';
                          else if (rate >= 10) return 'discount-mid';
                          else return 'discount-low';
                        })()}`}>
                          {product.discountrate}%OFF
                        </span>
                        <span className="actual-price-inline">
                          <span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  {product.price <= product.effectiveprice && (
                    <div className="discount-actual-row">
                      <span className={`discount-rate-inline ${(() => {
                        const rate = product.discountrate;
                        if (rate >= 30) return 'discount-high';
                        else if (rate >= 10) return 'discount-mid';
                        else return 'discount-low';
                      })()}`}>
                        {product.discountrate}%OFF
                      </span>
                      <span className="actual-price-inline">
                        <span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="normal-price-row">
              <span className="actual-price">
                <span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}
              </span>
            </div>
          )}

          {/* バッジ行（PCのみ） */}
          {!isMobile && (
            <div className="badge-row">
              {(() => {
                const campaignTypes = [...new Set(product.campaigns.map(c => c.type))];
                const hasPointCampaign = campaignTypes.includes('ポイント');
                const allowedTypes = ['クーポン', 'セール'];
                const hasSaleByPrice = (
                  typeof product.discountrate === 'number' && product.discountrate > 0
                ) || (
                  product.effectiveprice > 0 && product.price > product.effectiveprice
                );
                const displayTypesSet = new Set<string>(campaignTypes);
                const hasSaleType = campaignTypes.includes('セール');
                const hasCouponType = campaignTypes.includes('クーポン');
                const shouldAddSale = hasSaleByPrice && !hasSaleType && !hasCouponType;
                if (shouldAddSale) displayTypesSet.add('セール');
                const otherCampaigns = [...displayTypesSet].filter(type =>
                  type !== 'ポイント' && allowedTypes.includes(type)
                );
                return (
                  <>
                    {hasPointCampaign && (
                      <span className="badge point-badge">ポイントUP</span>
                    )}
                    {otherCampaigns.map((type, index) => {
                      let badgeClass = 'badge';
                      if (type === 'セール') badgeClass += ' sale-badge';
                      else if (type === 'クーポン') badgeClass += ' coupon-badge';
                      return (
                        <span key={index} className={badgeClass}>
                          {type}
                        </span>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          )}

          {/* 送料/ポイント情報 */}
          <div className="shipping-points-container">
            <div className={`shipping-fee-text ${product.shippingFee === 0 ? 'free' : ''}`}>
              {product.shippingFee === 0 ? '送料 無料' : `送料 ¥${product.shippingFee.toLocaleString()}`}
            </div>
            <div className="point-reward-text">
              {(() => {
                const pointCampaigns = product.campaigns.filter(c => c.type === 'ポイント');
                const campaignPoints = pointCampaigns.reduce((sum, c) => sum + c.amount, 0);
                const totalPoints = product.regularPoint + campaignPoints;
                return `${totalPoints.toLocaleString()}ポイント還元`;
              })()}
            </div>
          </div>
        </div>
      </div>
      {/* SP: 商品名行に重ねる保存ボタン（search と同じ階層・位置指定） */}
      <span
        role="button"
        aria-label={saved ? '保存済み' : '保存'}
        aria-pressed={saved}
        tabIndex={0}
        className={`bookmark-btn bookmark-btn--sp ${saved ? 'is-saved' : ''}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaved(product.id); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleSaved(product.id); } }}
      >
        <svg className="bookmark-svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 3.75C6 3.06 6.56 2.5 7.25 2.5h9.5c.69 0 1.25.56 1.25 1.25v16.2c0 .46-.5.75-.92.53L12 17.6l-5.08 3.88c-.42.32-.92-.07-.92-.53V3.75Z"/>
        </svg>
      </span>
    </a>
  ); } 

  function SavedToggle({ productId }: { productId: string }) {
    const { isSaved, toggleSaved } = useSavedItems();
    const saved = isSaved(productId);
    return (
      <span
        role="button"
        aria-label={saved ? '保存済み' : '保存'}
        aria-pressed={saved}
        tabIndex={0}
        className={`bookmark-btn bookmark-btn--pc ${saved ? 'is-saved' : ''}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaved(productId); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleSaved(productId); } }}
      >
        <svg className="bookmark-svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 3.75C6 3.06 6.56 2.5 7.25 2.5h9.5c.69 0 1.25.56 1.25 1.25v16.2c0 .46-.5.75-.92.53L12 17.6l-5.08 3.88c-.42.32-.92-.07-.92-.53V3.75Z"/>
        </svg>
      </span>
    );
  }

  return (
    <div className="nextjs-products-scope">
      <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
        <div className="products-container page-min-height">
          <h1 className="results-title">保存した商品一覧</h1>
          <div className="product-list">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SavedPage() {
  return (
    <Suspense fallback={<LoadingSpinner type="data" />}>
      <SavedListContent />
    </Suspense>
  );
}


