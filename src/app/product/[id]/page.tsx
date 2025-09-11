import { Metadata } from 'next';
import { headers } from 'next/headers';

// ISR: 30分で再生成
export const revalidate = 1800;

type Product = {
  id: string;
  name: string;
  maker: string;
  price: number;
  effectiveprice: number;
  cpu: string;
  gpu: string;
  memory: string;
  storage: string;
  imageUrl: string;
  productUrl: string;
  discountrate: number;
  shippingFee: number;
  regularPoint: number;
  promotionSummary?: Array<{
    type: string;
    label?: string;
    code?: string;
    validUntil?: string;
    notes?: string;
  }>;
  relatedArticleUrls?: string[];
};

function getOriginFromHeaders(): string {
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  return `${proto}://${host}`;
}

async function fetchProductById(id: string): Promise<Product | null> {
  const origin = getOriginFromHeaders();
  const url = `${origin}/db/api/product/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'force-cache',
    next: { revalidate: 1800 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  const data = await res.json();
  return (data?.product as Product) || null;
}

async function fetchProductByIdFallback(id: string): Promise<Product | null> {
  // 予備: 一覧APIから抽出（内部ルーティングや権限で単品APIが失敗するケースの回避）
  const origin = getOriginFromHeaders();
  const res = await fetch(`${origin}/db/api/products?limit=5000`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'force-cache',
    next: { revalidate: 1800 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const products = (data?.products || []) as Product[];
  return products.find(p => p.id === id) || null;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const product = await fetchProductById(decodeURIComponent(params.id));
    if (!product) {
      return { title: '商品が見つかりませんでした | イヤバズDB' };
    }
    return {
      title: `${product.name} | イヤバズDB`,
      description: `${product.maker} | ${product.cpu} / ${product.gpu} | 価格: ¥${product.effectiveprice.toLocaleString()}`,
      openGraph: {
        title: `${product.name} | イヤバズDB`,
        description: `${product.maker} | ${product.cpu} / ${product.gpu}`,
        images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
      },
    };
  } catch {
    return { title: '商品詳細 | イヤバズDB' };
  }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  let product: Product | null = null;

  try {
    product = await fetchProductById(id);
    if (!product) {
      product = await fetchProductByIdFallback(id);
    }
  } catch (e) {
    console.error('商品詳細の取得に失敗しました:', e);
  }

  if (!product) {
    return (
      <div className="nextjs-products-scope">
        <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
          <div className="products-container">
            <h1 className="results-title">商品が見つかりませんでした</h1>
            <p className="text-gray-600" style={{ marginTop: 12 }}>URL をご確認ください。</p>
            <a href="/db/search" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" style={{ marginTop: 16 }}>商品一覧へ戻る</a>
          </div>
        </div>
      </div>
    );
  }

  const priceBlock = (
    <div className="price-block">
      {product.discountrate > 0 ? (
        <div className="sale-price-container">
          {product.price > product.effectiveprice && (
            <div className="original-price-row">
              <span className="original-price-inline">
                <span className="tax-included-small">税込</span>
                <span className="list-price-strikethrough">¥{product.price.toLocaleString()}</span>
              </span>
            </div>
          )}
          <div className="discount-actual-row">
            <span className="discount-rate-inline">{product.discountrate}%OFF</span>
            <span className="actual-price-inline">
              <span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        <div className="normal-price-row">
          <span className="actual-price">
            <span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="nextjs-products-scope">
      <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
        <div className="products-container" style={{ paddingTop: 24 }}>
          <a href="/db/search" className="text-blue-600 hover:underline" style={{ display: 'inline-block', marginBottom: 12 }}>
            ← 商品一覧へ
          </a>
          <div className="product-detail">
            <h1 className="detail-title">{product.name}</h1>
            <div className="detail-divider" />

            <div className="detail-grid">
              <div className="detail-image">
                <img
                  src={product.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+'}
                  alt={product.name}
                />
              </div>

              <div className="detail-right">
                <div className="detail-price">
                  <div className="maker-name">{product.maker}</div>
                  {priceBlock}
                  {product.productUrl && (
                    <a href={product.productUrl} target="_blank" rel="nofollow sponsored" className="btn-primary" style={{ marginTop: 12, display: 'inline-block' }}>
                      公式サイトで見る
                    </a>
                  )}
                </div>

                <div className="detail-specs">
                  <div className="spec-item"><div className="spec-label">CPU</div><div className="spec-value">{product.cpu || '情報なし'}</div></div>
                  <div className="spec-item"><div className="spec-label">GPU</div><div className="spec-value">{product.gpu || '情報なし'}</div></div>
                  <div className="spec-item"><div className="spec-label">メモリ</div><div className="spec-value">{product.memory || '情報なし'}</div></div>
                  <div className="spec-item"><div className="spec-label">ストレージ</div><div className="spec-value">{product.storage || '情報なし'}</div></div>
                </div>
              </div>
            </div>

            {/* 任意セクション（必要に応じて後段に表示） */}
            {Array.isArray(product.promotionSummary) && product.promotionSummary.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h2 className="results-title" style={{ fontSize: 18 }}>セール・クーポン</h2>
                <ul style={{ marginTop: 8 }}>
                  {product.promotionSummary!.map((p, idx) => (
                    <li key={idx} style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{p.label || p.type}</span>
                      {p.code && <span style={{ marginLeft: 8 }}>コード: {p.code}</span>}
                      {p.validUntil && <span style={{ marginLeft: 8 }}>〜{p.validUntil}</span>}
                      {p.notes && <span style={{ marginLeft: 8, color: '#666' }}>{p.notes}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(product.relatedArticleUrls) && product.relatedArticleUrls.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h2 className="results-title" style={{ fontSize: 18 }}>関連記事</h2>
                <ul style={{ marginTop: 8 }}>
                  {product.relatedArticleUrls!.map((url, idx) => (
                    <li key={idx} style={{ marginBottom: 6 }}>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{url}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="detail-divider" />
            <section className="related-section">
              <h2 className="related-title">関連商品</h2>
              <div className="related-placeholder">準備中</div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}


