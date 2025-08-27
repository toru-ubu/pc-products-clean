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

// GET リクエストの処理（商品一覧取得）
export async function GET(request: NextRequest) {
  try {
    // URLパラメータを取得
    const { searchParams } = new URL(request.url);
    const maker = searchParams.get('maker');
    const type = searchParams.get('type');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    console.log('API: 商品データ取得リクエスト', {
      maker, type, priceMin, priceMax, search, limit, offset
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

    // レスポンスデータを構築
    const responseData = {
      products: paginatedProducts,
      totalCount: filteredProducts.length,
      currentPage: Math.floor(offsetNum / limitNum) + 1,
      totalPages: Math.ceil(filteredProducts.length / limitNum),
      hasMore: offsetNum + limitNum < filteredProducts.length
    };

    console.log(`API: 商品データ取得成功 - ${paginatedProducts.length}件 / 総${filteredProducts.length}件`);

    return NextResponse.json(responseData, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('API: 商品データ取得エラー:', error);
    
    return NextResponse.json(
      { 
        error: '商品データの取得に失敗しました',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
}

// POST リクエストの処理（検索・フィルター用）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters, search, pagination } = body;

    console.log('API: 商品検索リクエスト', { filters, search, pagination });

    // Firebaseから商品データを取得
    const products = await getProducts();
    let filteredProducts = products;

    // フィルター適用
    if (filters) {
      if (filters.maker && filters.maker.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
          filters.maker.some((m: string) => product.maker.includes(m))
        );
      }

      if (filters.type && filters.type.length > 0) {
        filteredProducts = filteredProducts.filter(product => 
          filters.type.some((t: string) => product.type.includes(t))
        );
      }

      if (filters.priceMin) {
        filteredProducts = filteredProducts.filter(product => 
          product.effectiveprice >= filters.priceMin
        );
      }

      if (filters.priceMax) {
        filteredProducts = filteredProducts.filter(product => 
          product.effectiveprice <= filters.priceMax
        );
      }
    }

    // 検索適用
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
    const limit = pagination?.limit || 50;
    const offset = pagination?.offset || 0;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    const responseData = {
      products: paginatedProducts,
      totalCount: filteredProducts.length,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(filteredProducts.length / limit),
      hasMore: offset + limit < filteredProducts.length
    };

    console.log(`API: 商品検索成功 - ${paginatedProducts.length}件 / 総${filteredProducts.length}件`);

    return NextResponse.json(responseData, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('API: 商品検索エラー:', error);
    
    return NextResponse.json(
      { 
        error: '商品検索に失敗しました',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
}
