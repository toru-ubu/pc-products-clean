import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// CDN/ISRキャッシュ（30分）
export const revalidate = 1800;

// CORS設定（/api/products と同一方針）
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
    ? '*' 
    : 'https://earbuds-plus.jp',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const id = decodeURIComponent(context.params.id);
    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400, headers: corsHeaders });
    }

    const ref = doc(db, 'products', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    const data = snap.data() as any;

    // 最低限の整形（/api/products と同等のキー名）
    const product = {
      id: snap.id,
      name: data.name || '',
      maker: data.maker || '',
      type: data.type || data.category || 'デスクトップ',
      price: data.price || 0,
      effectiveprice: data.effectivePrice || data.price || 0,
      cpu: data.cpu || '',
      gpu: data.gpu || '',
      memory: data.memory || '',
      storage: data.storage || '',
      imageUrl: data.imageUrl || data.image_url || '',
      productUrl: data.productUrl || '',
      isActive: data.isActive !== false,
      campaigns: data.campaigns || [],
      campaignIds: data.campaignIds || [],
      discountrate: data.discountRate || 0,
      shippingFee: data.shippingFee || 0,
      regularPoint: data.regularPoint || 0,
      category: data.category || '',
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
      promotionSummary: data.promotionSummary || [],
      relatedArticleUrls: data.relatedArticleUrls || [],
      relatedProducts: data.relatedProducts || [],
    };

    // 非アクティブでも単品は返す（詳細確認・デバッグ用途も考慮）

    const cacheHeaders = {
      ...corsHeaders,
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400'
    } as Record<string, string>;

    return NextResponse.json({ product }, { headers: cacheHeaders });
  } catch (error) {
    console.error('API: 単品商品取得エラー:', error);
    return NextResponse.json(
      { error: '商品データの取得に失敗しました' },
      { status: 500, headers: corsHeaders }
    );
  }
}


