import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // filter-options.jsonを読み込み
    const filterOptionsPath = path.join(process.cwd(), 'public', 'config', 'filter-options.json');
    const filterOptionsData = fs.readFileSync(filterOptionsPath, 'utf8');
    const filterOptions = JSON.parse(filterOptionsData);

    // メーカー一覧を生成
    const manufacturers = filterOptions.makers.map((maker: string) => ({
      name: maker,
      slug: maker.toLowerCase().replace(/\s+/g, '-'),
      url: `/db/search?maker=${encodeURIComponent(maker)}`
    }));

    // CPU一覧を生成（階層構造を平坦化）
    const cpus: Array<{name: string, slug: string, url: string}> = [];
    Object.entries(filterOptions.cpuOptionsHierarchy).forEach(([series, models]) => {
      (models as string[]).forEach(model => {
        cpus.push({
          name: model,
          slug: model.toLowerCase().replace(/\s+/g, '-'),
          url: `/db/search?cpu=${encodeURIComponent(model)}`
        });
      });
    });

    // GPU一覧を生成（階層構造を平坦化）
    const gpus: Array<{name: string, slug: string, url: string}> = [];
    Object.entries(filterOptions.gpuOptionsHierarchy).forEach(([series, models]) => {
      (models as string[]).forEach(model => {
        gpus.push({
          name: model,
          slug: model.toLowerCase().replace(/\s+/g, '-'),
          url: `/db/search?gpu=${encodeURIComponent(model)}`
        });
      });
    });

    // メモリ一覧を生成
    const memories = filterOptions.memoryOptions.map((memory: string) => ({
      name: memory,
      slug: memory.toLowerCase(),
      url: `/db/search?memory=${encodeURIComponent(memory)}`
    }));

    // ストレージ一覧を生成
    const storages = filterOptions.storageOptions.map((storage: string) => ({
      name: storage,
      slug: storage.toLowerCase(),
      url: `/db/search?storage=${encodeURIComponent(storage)}`
    }));

    const widgetData = {
      // 基本情報
      title: "メーカー横断で探せる日本最大級のゲーミングPC検索ツール",
      
      // メインボタン
      mainButtons: [
        { 
          text: "メーカーから探す", 
          type: "manufacturer", 
          color: "red",
          url: "/db/search?view=manufacturer"
        },
        { 
          text: "GPUから探す", 
          type: "gpu", 
          color: "blue",
          url: "/db/search?view=gpu"
        }
      ],
      
      // 検索バー
      search: {
        placeholder: "メーカー・スペック・キーワード",
        action: "/db/search"
      },
      
      // 価格帯検索
      priceRanges: [
        { 
          label: "10万円以下", 
          max: 100000,
          url: "/db/search?priceMax=100000"
        },
        { 
          label: "10万円~20万円", 
          min: 100000, 
          max: 200000,
          url: "/db/search?priceMin=100000&priceMax=200000"
        },
        { 
          label: "20万円~30万円", 
          min: 200000, 
          max: 300000,
          url: "/db/search?priceMin=200000&priceMax=300000"
        },
        { 
          label: "30万円以上", 
          min: 300000,
          url: "/db/search?priceMin=300000"
        }
      ],
      
      // 実際のデータから生成
      manufacturers,
      cpus,
      gpus,
      memories,
      storages,
      
      // 階層構造も提供（モーダル用）
      cpuOptionsHierarchy: filterOptions.cpuOptionsHierarchy,
      gpuOptionsHierarchy: filterOptions.gpuOptionsHierarchy,
      
      // カテゴリ一覧
      categories: [
        { name: "ゲーミングPC", slug: "gaming", url: "/db/search?category=gaming" },
        { name: "クリエイターPC", slug: "creator", url: "/db/search?category=creator" },
        { name: "ビジネスPC", slug: "business", url: "/db/search?category=business" },
        { name: "デスクトップ", slug: "desktop", url: "/db/search?category=desktop" },
        { name: "ノートPC", slug: "laptop", url: "/db/search?category=laptop" }
      ],
      
      // セール情報
      sales: [
        { name: "セール中", slug: "sale", url: "/db/search?sale=true" },
        { name: "ポイント還元", slug: "point", url: "/db/search?point=true" },
        { name: "クーポン対象", slug: "coupon", url: "/db/search?coupon=true" }
      ]
    };

    return NextResponse.json(widgetData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error loading filter options:', error);
    return NextResponse.json(
      { error: 'Failed to load filter options' },
      { status: 500 }
    );
  }
}
