import { NextRequest, NextResponse } from 'next/server';

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

// GET リクエストの処理
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  
  // パスに応じた処理を追加（将来的な拡張用）
  if (path === 'products') {
    // 商品一覧APIの例（将来的な実装）
    return NextResponse.json(
      { message: 'Products API endpoint' },
      { headers: corsHeaders }
    );
  }
  
  // デフォルトレスポンス
  return NextResponse.json(
    { message: `API endpoint: ${path}` },
    { headers: corsHeaders }
  );
}

// POST リクエストの処理
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  
  // パスに応じた処理を追加（将来的な拡張用）
  if (path === 'search') {
    // 検索APIの例（将来的な実装）
    const body = await request.json();
    return NextResponse.json(
      { message: 'Search API endpoint', query: body },
      { headers: corsHeaders }
    );
  }
  
  // デフォルトレスポンス
  return NextResponse.json(
    { message: `POST API endpoint: ${path}` },
    { headers: corsHeaders }
  );
}
