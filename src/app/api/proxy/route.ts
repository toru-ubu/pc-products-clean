import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/firebase';

// CORS設定
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://earbuds-plus.jp',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24時間
};

// OPTIONS リクエスト（CORS事前チェック）の処理
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET リクエストの処理（プロキシ統合用HTML生成）
export async function GET(request: NextRequest) {
  try {
    // URLパラメータを取得
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'html';
    const maker = searchParams.get('maker');
    const type = searchParams.get('type');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';

    console.log('API: プロキシ統合リクエスト', {
      format, maker, type, priceMin, priceMax, search, limit, offset
    });

    // Firebaseから商品データを取得
    const products = await getProducts();
    
    // フィルタリング処理
    let filteredProducts = products;

    // メーカーフィルター
    if (maker) {
      const makers = maker.split(',').map(m => m.trim());
      filteredProducts = filteredProducts.filter(product => 
        makers.some(m => product.maker.includes(m))
      );
    }

    // タイプフィルター
    if (type) {
      const types = type.split(',').map(t => t.trim());
      filteredProducts = filteredProducts.filter(product => 
        types.some(t => product.type.includes(t))
      );
    }

    // 価格フィルター
    if (priceMin) {
      filteredProducts = filteredProducts.filter(product => 
        product.effectiveprice >= parseInt(priceMin)
      );
    }
    if (priceMax) {
      filteredProducts = filteredProducts.filter(product => 
        product.effectiveprice <= parseInt(priceMax)
      );
    }

    // 検索フィルター
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.maker.toLowerCase().includes(searchLower) ||
        product.cpu.toLowerCase().includes(searchLower) ||
        product.gpu.toLowerCase().includes(searchLower)
      );
    }

    // ページネーション
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const paginatedProducts = filteredProducts.slice(offsetNum, offsetNum + limitNum);

    if (format === 'json') {
      // JSON形式で返す
      const responseData = {
        products: paginatedProducts,
        totalCount: filteredProducts.length,
        currentPage: Math.floor(offsetNum / limitNum) + 1,
        totalPages: Math.ceil(filteredProducts.length / limitNum),
        hasMore: offsetNum + limitNum < filteredProducts.length
      };

      return NextResponse.json(responseData, {
        headers: corsHeaders
      });
    } else {
      // HTML形式で返す（プロキシ統合用）
      const html = generateProductsHTML(paginatedProducts, {
        totalCount: filteredProducts.length,
        currentPage: Math.floor(offsetNum / limitNum) + 1,
        totalPages: Math.ceil(filteredProducts.length / limitNum),
        hasMore: offsetNum + limitNum < filteredProducts.length
      });

      return new NextResponse(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    }

  } catch (error) {
    console.error('API: プロキシ統合エラー:', error);
    
    const errorHtml = `
      <div class="error-message" style="padding: 20px; color: #dc3545; text-align: center;">
        <h3>商品データの取得に失敗しました</h3>
        <p>しばらく時間をおいてから再度お試しください。</p>
      </div>
    `;
    
    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }
}

// 商品一覧のHTMLを生成する関数
function generateProductsHTML(products: Array<{
  id: string;
  name: string;
  maker: string;
  type: string;
  price: number;
  effectiveprice: number;
  cpu: string;
  gpu: string;
  memory: string;
  storage: string;
  imageUrl: string;
  productUrl: string;
  discountrate: number;
}>, pagination: {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}) {
  const productsHtml = products.map(product => `
    <div class="product-card" style="
      border: 1px solid #e5e7eb; 
      border-radius: 8px; 
      padding: 16px; 
      margin-bottom: 16px; 
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    ">
      <div style="display: flex; gap: 16px;">
        <div style="flex-shrink: 0;">
          <img src="${product.imageUrl || 'https://via.placeholder.com/150x100?text=No+Image'}" 
               alt="${product.name}" 
               style="width: 150px; height: 100px; object-fit: cover; border-radius: 4px;">
        </div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
            ${product.name}
          </h3>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
            <strong>メーカー:</strong> ${product.maker}
          </p>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
            <strong>CPU:</strong> ${product.cpu}
          </p>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
            <strong>GPU:</strong> ${product.gpu}
          </p>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
            <strong>メモリ:</strong> ${product.memory} | <strong>ストレージ:</strong> ${product.storage}
          </p>
          <div style="margin-top: 8px;">
            <span style="
              font-size: 20px; 
              font-weight: bold; 
              color: #dc2626;
            ">¥${product.effectiveprice.toLocaleString()}</span>
            ${product.discountrate > 0 ? `
              <span style="
                background: #dc2626; 
                color: white; 
                padding: 2px 6px; 
                border-radius: 4px; 
                font-size: 12px; 
                margin-left: 8px;
              ">${product.discountrate}%OFF</span>
            ` : ''}
          </div>
          ${product.productUrl ? `
            <a href="${product.productUrl}" 
               target="_blank" 
               rel="noopener noreferrer"
               style="
                 display: inline-block; 
                 margin-top: 8px; 
                 padding: 8px 16px; 
                 background: #3b82f6; 
                 color: white; 
                 text-decoration: none; 
                 border-radius: 4px; 
                 font-size: 14px;
               ">商品詳細を見る</a>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');

  const paginationHtml = pagination.totalPages > 1 ? `
    <div style="
      display: flex; 
      justify-content: center; 
      align-items: center; 
      gap: 8px; 
      margin-top: 20px;
    ">
      <span style="color: #6b7280; font-size: 14px;">
        ${pagination.totalCount}件中 ${((pagination.currentPage - 1) * 20) + 1}-${Math.min(pagination.currentPage * 20, pagination.totalCount)}件を表示
      </span>
    </div>
  ` : '';

  return `
    <div class="nextjs-products-scope" style="
      isolation: isolate; 
      contain: layout style; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
        <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
          イヤバズDB - PC商品一覧
        </h2>
        <div class="products-container">
          ${productsHtml}
        </div>
        ${paginationHtml}
      </div>
    </div>
  `;
}
