import Link from 'next/link';
import { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div className="product-card">
      <Link href={product.productUrl} target="_blank" rel="nofollow sponsored">
        <div className="card-content">
          {/* 商品画像 */}
          <div className="card-image">
            <img 
              src={product.imageUrl} 
              alt={product.name}
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+';
              }}
            />
          </div>
          
          {/* 商品情報 */}
          <div className="card-info">
            <strong>
              {product.name}
            </strong>
            <div className="maker-name">
              {product.maker}
            </div>
            
            {/* スペック情報 */}
            <div className="spec-info">
              {product.cpu && (
                <div className="spec-item">
                  <span className="spec-label">CPU:</span>
                  <span className="spec-value">{product.cpu}</span>
                </div>
              )}
              {product.gpu && (
                <div className="spec-item">
                  <span className="spec-label">GPU:</span>
                  <span className="spec-value">{product.gpu}</span>
                </div>
              )}
              {product.memory && (
                <div className="spec-item">
                  <span className="spec-label">メモリ:</span>
                  <span className="spec-value">{product.memory}</span>
                </div>
              )}
              {product.storage && (
                <div className="spec-item">
                  <span className="spec-label">ストレージ:</span>
                  <span className="spec-value">{product.storage}</span>
                </div>
              )}
            </div>
            
            {/* 価格ブロック */}
            <div className="price-block">
              <div className="price-row">
                <span className="actual-price">
                  {product.effectiveprice > 0 ? `¥${product.effectiveprice.toLocaleString()}` : '価格未定'}
                </span>
                {product.price > product.effectiveprice && product.effectiveprice > 0 && (
                  <span className="list-price-strikethrough">
                    ¥{product.price.toLocaleString()}
                  </span>
                )}
                {product.effectiveprice > 0 && <span className="tax-included">税込</span>}
              </div>
              
              {/* バッジ行 */}
              <div className="badge-row">
                {product.discountrate > 0 && (
                  <span className="badge discount-rate-badge">
                    {product.discountrate}%OFF
                  </span>
                )}
                {product.shippingFee === 0 && (
                  <span className="badge">
                    送料無料
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
