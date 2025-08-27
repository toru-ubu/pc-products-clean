import { Product, FilterState } from '../types/product';
import { get_cpu_generation, get_gpu_series } from './productUtils';

// 共通フィルター処理関数
export const getFilteredProducts = (
  allProducts: Product[],
  searchKeyword: string,
  filters: FilterState,
  sortOption: string
): Product[] => {
  let filtered = [...allProducts];

  // 検索キーワードでフィルター（商品名、メーカー名、CPU、GPU、メモリ、ストレージ、カテゴリ）
  if (searchKeyword.trim()) {
    const keyword = searchKeyword.toLowerCase();
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(keyword) ||
      product.maker.toLowerCase().includes(keyword) ||
      product.cpu.toLowerCase().includes(keyword) ||
      product.gpu.toLowerCase().includes(keyword) ||
      product.memory.toLowerCase().includes(keyword) ||
      product.storage.toLowerCase().includes(keyword) ||
      product.category.toLowerCase().includes(keyword)
    );
  }

  // フィルター適用
  filtered = filtered.filter(product => {
    if (filters.maker.length > 0 && !filters.maker.includes(product.maker)) return false;
    if (filters.cpu.length > 0 && !filters.cpu.includes(get_cpu_generation(product.cpu))) return false;
    if (filters.gpu.length > 0 && !filters.gpu.includes(get_gpu_series(product.gpu))) return false;
    if (filters.memory.length > 0 && !filters.memory.includes(product.memory)) return false;
    if (filters.storage.length > 0 && !filters.storage.includes(product.storage)) return false;
    if (product.effectiveprice < filters.priceMin || product.effectiveprice > filters.priceMax) return false;
    return true;
  });

  // ソート適用
  return applySorting(filtered, sortOption);
};

// ソートを適用する関数（productUtilsからインポート）
import { applySorting } from './productUtils';

// フィルター項目の定数
export const MAKERS = ['ドスパラ', 'パソコン工房', 'ツクモ', 'サイコム', 'レノボ', 'フロンティア'];
export const CPU_GENERATIONS = ['Core Ultra', 'Core i 14th Gen', 'Core i 13th Gen', 'Core i 12th Gen', 'Ryzen 9000シリーズ', 'Ryzen 8000シリーズ', 'Ryzen 7000シリーズ', 'Ryzen 5000シリーズ', 'Ryzen 4000シリーズ', '旧世代'];
export const GPU_SERIES = ['RTX 50シリーズ', 'RTX 40シリーズ', 'RTX 30シリーズ', 'RTX 20シリーズ', 'GTX 16シリーズ', 'GTX 10シリーズ', 'RX 9000シリーズ', 'RX 7000シリーズ', 'RX 6000シリーズ', 'RX 5000シリーズ', 'Intel Arc', '内蔵GPU', 'その他'];
export const MEMORY_SIZES = ['8GB', '16GB', '32GB', '64GB'];
export const STORAGE_SIZES = ['256GB', '512GB', '1TB', '2TB'];

// 初期フィルター状態
export const initialFilters: FilterState = {
  maker: [],
  cpu: [],
  gpu: [],
  memory: [],
  storage: [],
  priceMin: 100000,  // 10万円
  priceMax: 800000   // 80万円
};
