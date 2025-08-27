import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterState } from '../types/product';
import { getURLParamsFromState as getURLParamsFromStateUtil, parseURLParams as parseURLParamsUtil } from '../utils/urlUtils';

export const useURLSync = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateURLParams = useCallback((newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // 既存のパラメータをクリア
    params.delete('keyword');
    params.delete('sort');
    params.delete('page');
    params.delete('maker');
    params.delete('cpu');
    params.delete('gpu');
    params.delete('memory');
    params.delete('storage');
    params.delete('priceMin');
    params.delete('priceMax');
    
    // 新しいパラメータを設定
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    
    const newURL = `?${params.toString()}`;
    router.push(newURL, { scroll: false });
  }, [router, searchParams]);

  const getURLParamsFromState = useCallback((
    searchKeyword: string,
    sortOption: string,
    currentPage: number,
    filters: FilterState
  ) => {
    return getURLParamsFromStateUtil(searchKeyword, sortOption, currentPage, filters);
  }, []);

  const parseURLParams = useCallback(() => {
    return parseURLParamsUtil(searchParams);
  }, [searchParams]);

  return {
    updateURLParams,
    getURLParamsFromState,
    parseURLParams
  };
};
