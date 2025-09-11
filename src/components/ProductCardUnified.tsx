"use client";

import React, { useEffect, useState } from 'react';
import { Product, logCustomEvent } from '../lib/firebase';
import { useSavedItems } from '../context/SavedItemsContext';
import { shouldShowNew } from '../utils/productUtils';

type ProductCardUnifiedProps = {
  product: Product;
  currentPage?: number;
  currentSort?: string;
};

export default function ProductCardUnified({ product, currentPage = 1, currentSort = 'price-asc' }: ProductCardUnifiedProps) {
  const { isSaved, toggleSaved } = useSavedItems();
  const saved = isSaved(product.id);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(product.id);
  };

  return (
    <a href={product.productUrl} target="_blank" rel="nofollow sponsored" className="product-card" onClick={() => logCustomEvent('click', {
      item_id: product.id,
      item_name: product.name,
      item_maker: product.maker,
      item_price: product.price,
      item_effective_price: product.effectiveprice,
      item_discount_rate: product.discountrate,
      item_cpu: product.cpu,
      item_gpu: product.gpu,
      item_memory: product.memory,
      item_storage: product.storage,
      item_type: product.type,
      current_page: currentPage,
      current_sort: currentSort
    })}>
      <div className="card-content">
        <span
          role="button"
          aria-label={saved ? '保存済み' : '保存'}
          aria-pressed={saved}
          tabIndex={0}
          className={`bookmark-btn bookmark-btn--pc ${saved ? 'is-saved' : ''}`}
          onClick={handleToggle}
          onKeyDown={(e) => { if ((e as React.KeyboardEvent).key === 'Enter' || (e as React.KeyboardEvent).key === ' ') handleToggle(e); }}
        >
          <svg className="bookmark-svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 3.75C6 3.06 6.56 2.5 7.25 2.5h9.5c.69 0 1.25.56 1.25 1.25v16.2c0 .46-.5.75-.92.53L12 17.6l-5.08 3.88c-.42.32-.92-.07-.92-.53V3.75Z"/>
          </svg>
        </span>

        <div className="card-header">
          <strong>{shouldShowNew(product) && (<span className="new-prefix" title="掲載から14日以内">NEW!</span>)}{product.name}</strong>
          <span className="maker-name">{product.maker}</span>
        </div>

        <div className="card-body">
          <div className="card-image">
            <img 
              src={product.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+'}
              alt={product.name}
            />
          </div>

          <div className="card-info">
            <div className="pc-only-header">
              <strong>{shouldShowNew(product) && (<span className="new-prefix" title="掲載から14日以内">NEW!</span>)}{product.name}</strong>
              <span className="maker-name">{product.maker}</span>
            </div>
            <div className="spec-info">
              <div className="spec-item"><div className="spec-label">CPU</div><div className="spec-value">{product.cpu || '情報なし'}</div></div>
              <div className="spec-item"><div className="spec-label">GPU</div><div className="spec-value">{product.gpu || '情報なし'}</div></div>
              <div className="spec-item"><div className="spec-label">メモリ</div><div className="spec-value">{product.memory || '情報なし'}</div></div>
              <div className="spec-item"><div className="spec-label">ストレージ</div><div className="spec-value">{product.storage || '情報なし'}</div></div>
            </div>
          </div>
        </div>

        <div className="price-block">
          {product.discountrate > 0 ? (
            <>
              {isMobile ? (
                <div className="sale-price-container">
                  {product.price > product.effectiveprice ? (
                    <>
                      <div className="discount-rate-row">
                        <span className={`discount-rate-badge-sp ${(() => { const rate = product.discountrate; if (rate >= 30) return 'discount-high'; else if (rate >= 10) return 'discount-mid'; else return 'discount-low'; })()}`}>
                          {product.discountrate}%OFF
                        </span>
                      </div>
                      <div className="price-row">
                        <span className="original-price-inline"><span className="list-price-strikethrough">¥{product.price.toLocaleString()}</span></span>
                        <span className="actual-price-inline"><span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <div className="discount-actual-row">
                      <span className={`discount-rate-badge-sp ${(() => { const rate = product.discountrate; if (rate >= 30) return 'discount-high'; else if (rate >= 10) return 'discount-mid'; else return 'discount-low'; })()}`}>{product.discountrate}%OFF</span>
                      <span className="actual-price-inline"><span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="sale-price-container">
                  {product.price > product.effectiveprice ? (
                    <>
                      <div className="original-price-row"><span className="original-price-inline"><span className="tax-included-small">税込</span><span className="list-price-strikethrough">¥{product.price.toLocaleString()}</span></span></div>
                      <div className="discount-actual-row">
                        <span className={`discount-rate-inline ${(() => { const rate = product.discountrate; if (rate >= 30) return 'discount-high'; else if (rate >= 10) return 'discount-mid'; else return 'discount-low'; })()}`}>{product.discountrate}%OFF</span>
                        <span className="actual-price-inline"><span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <div className="discount-actual-row">
                      <span className={`discount-rate-inline ${(() => { const rate = product.discountrate; if (rate >= 30) return 'discount-high'; else if (rate >= 10) return 'discount-mid'; else return 'discount-low'; })()}`}>{product.discountrate}%OFF</span>
                      <span className="actual-price-inline"><span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="normal-price-row"><span className="actual-price"><span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}</span></div>
          )}
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
                const otherCampaigns = [...displayTypesSet].filter(t => t !== 'ポイント' && allowedTypes.includes(t));
                return (
                  <>
                    {hasPointCampaign && (<span className="badge point-badge">ポイントUP</span>)}
                    {otherCampaigns.map((type, index) => {
                      let badgeClass = 'badge';
                      if (type === 'セール') badgeClass += ' sale-badge';
                      else if (type === 'クーポン') badgeClass += ' coupon-badge';
                      return (<span key={index} className={badgeClass}>{type}</span>);
                    })}
                  </>
                );
              })()}
            </div>
          )}
          <div className="shipping-points-container">
            <div className={`shipping-fee-text ${product.shippingFee === 0 ? 'free' : ''}`}>{product.shippingFee === 0 ? '送料 無料' : `送料 ¥${product.shippingFee.toLocaleString()}`}</div>
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

      <span
        role="button"
        aria-label={saved ? '保存済み' : '保存'}
        aria-pressed={saved}
        tabIndex={0}
        className={`bookmark-btn bookmark-btn--sp ${saved ? 'is-saved' : ''}`}
        onClick={handleToggle}
        onKeyDown={(e) => { if ((e as React.KeyboardEvent).key === 'Enter' || (e as React.KeyboardEvent).key === ' ') handleToggle(e); }}
      >
        <svg className="bookmark-svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 3.75C6 3.06 6.56 2.5 7.25 2.5h9.5c.69 0 1.25.56 1.25 1.25v16.2c0 .46-.5.75-.92.53L12 17.6l-5.08 3.88c-.42.32-.92-.07-.92-.53V3.75Z"/>
        </svg>
      </span>
    </a>
  );
}


