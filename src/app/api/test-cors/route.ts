import { NextRequest, NextResponse } from 'next/server';

// CORS設定
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
    ? '*' 
    : 'https://earbuds-plus.jp',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24時間
};

// OPTIONS リクエスト（CORS事前チェック）の処理
export async function OPTIONS(_request: NextRequest) {
  console.log('CORS Test: OPTIONS request received');
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET リクエストの処理（CORSテスト用）
export async function GET(request: NextRequest) {
  console.log('CORS Test: GET request received');
  
  const testData = {
    message: 'CORS設定が正常に動作しています',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    corsHeaders: corsHeaders,
    requestHeaders: Object.fromEntries(request.headers.entries())
  };

  return NextResponse.json(testData, {
    headers: corsHeaders
  });
}

// POST リクエストの処理（CORSテスト用）
export async function POST(request: NextRequest) {
  console.log('CORS Test: POST request received');
  
  try {
    const body = await request.json();
    
    const testData = {
      message: 'CORS設定が正常に動作しています（POST）',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      receivedData: body,
      corsHeaders: corsHeaders
    };

    return NextResponse.json(testData, {
      headers: corsHeaders
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'リクエストボディの解析に失敗しました',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 400,
        headers: corsHeaders 
      }
    );
  }
}
