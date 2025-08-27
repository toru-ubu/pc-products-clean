import { FilterState } from '../types/product';

// URLパラメータ生成ヘルパー関数
export const getURLParamsFromState = (
  searchKeyword: string,
  sortOption: string,
  currentPage: number,
  filters: FilterState
) => {
  const params: Record<string, string | number> = {};
  
  if (searchKeyword.trim()) {
    params.keyword = searchKeyword.trim();
  }
  
  if (sortOption !== 'price_asc') {
    params.sort = sortOption;
  }
  
  if (currentPage > 1) {
    params.page = currentPage;
  }
  
  if (filters.maker.length > 0) {
    params.maker = filters.maker.join(',');
  }
  
  if (filters.cpu.length > 0) {
    params.cpu = filters.cpu.join(',');
  }
  
  if (filters.gpu.length > 0) {
    params.gpu = filters.gpu.join(',');
  }
  
  if (filters.memory.length > 0) {
    params.memory = filters.memory.join(',');
  }
  
  if (filters.storage.length > 0) {
    params.storage = filters.storage.join(',');
  }
  
  if (filters.priceMin > 0) {
    params.priceMin = filters.priceMin;
  }
  
  if (filters.priceMax < 500000) {
    params.priceMax = filters.priceMax;
  }
  
  return params;
};

// URLパラメータから状態を復元する関数
export const parseURLParams = (searchParams: URLSearchParams) => {
  const keyword = searchParams.get('keyword') || '';
  const sort = searchParams.get('sort') || 'price_asc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const maker = searchParams.get('maker')?.split(',').filter(Boolean) || [];
  const cpu = searchParams.get('cpu')?.split(',').filter(Boolean) || [];
  const gpu = searchParams.get('gpu')?.split(',').filter(Boolean) || [];
  const memory = searchParams.get('memory')?.split(',').filter(Boolean) || [];
  const storage = searchParams.get('storage')?.split(',').filter(Boolean) || [];
  const priceMin = parseInt(searchParams.get('priceMin') || '0', 10);
  const priceMax = parseInt(searchParams.get('priceMax') || '500000', 10);
  
  return {
    keyword,
    sort,
    page,
    filters: {
      maker,
      cpu,
      gpu,
      memory,
      storage,
      priceMin,
      priceMax
    }
  };
};
