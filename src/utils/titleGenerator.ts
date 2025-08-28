// 絞り込み条件に応じて動的タイトルを生成する関数

// ソート表示の変換
const getSortDisplay = (sortBy: string): string => {
  switch (sortBy) {
    case 'price-asc':
      return '安い順';
    case 'price-desc':
      return '高い順';
    case 'newest':
      return '新着順';
    case 'name-asc':
      return '商品名順';
    case 'maker-asc':
      return 'メーカー順';
    case 'discount-desc':
      return '値下げ率順';
    default:
      return '安い順';
  }
};

// 価格帯の表示形式を生成
const getPriceRangeDisplay = (priceMin: number, priceMax: number): string => {
  if (priceMin === 0 && priceMax === 1000000) {
    return ''; // デフォルト範囲の場合は表示しない
  }
  
  if (priceMin === 0) {
    return `${Math.floor(priceMax / 10000)}万円以下のPC`;
  }
  
  if (priceMax === 1000000) {
    return `${Math.floor(priceMin / 10000)}万円以上のPC`;
  }
  
  return `${Math.floor(priceMin / 10000)}万円〜${Math.floor(priceMax / 10000)}万円のPC`;
};

// 動的タイトル生成関数
export const generateDynamicTitle = (filterState: {
  applied: {
    maker: string[];
    cpu: string[];
    gpu: string[];
    priceMin: number;
    priceMax: number;
    searchKeyword: string;
    sortBy: string;
  };
}): string => {
  const { applied } = filterState;
  const titleParts: string[] = [];
  
  // 優先順位に従ってタイトル要素を追加
  // 1. メーカー（最初の1つ）
  if (applied.maker.length > 0) {
    titleParts.push(`${applied.maker[0]}のPC商品一覧`);
  }
  
  // 2. GPU（最初の1つ）
  if (applied.gpu.length > 0) {
    titleParts.push(`${applied.gpu[0]}搭載PC`);
  }
  
  // 3. CPU（最初の1つ）
  if (applied.cpu.length > 0) {
    titleParts.push(`${applied.cpu[0]}搭載PC`);
  }
  
  // 4. 価格帯
  const priceDisplay = getPriceRangeDisplay(applied.priceMin, applied.priceMax);
  if (priceDisplay) {
    titleParts.push(priceDisplay);
  }
  
  // 5. キーワード検索
  if (applied.searchKeyword.trim()) {
    titleParts.push(`${applied.searchKeyword} | 検索結果`);
  }
  
  // 基本タイトル（何も絞り込みがない場合）
  if (titleParts.length === 0) {
    titleParts.push('PC商品一覧');
  }
  
  // ソート表示を追加
  const sortDisplay = getSortDisplay(applied.sortBy);
  
  // タイトルを組み立て
  const mainTitle = titleParts.join(' ');
  return `${mainTitle} ${sortDisplay} | イヤバズDB`;
};
