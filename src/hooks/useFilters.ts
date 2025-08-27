import { useState, useCallback } from 'react';
import { FilterState, Product } from '../types/product';
import { initialFilters, getFilteredProducts } from '../utils/filterUtils';

export const useFilters = (allProducts: Product[]) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortOption, setSortOption] = useState('price_asc');

  const applyFilters = useCallback(() => {
    return getFilteredProducts(allProducts, searchKeyword, filters, sortOption);
  }, [allProducts, searchKeyword, filters, sortOption]);

  const updateFilter = useCallback((key: keyof FilterState, value: string[] | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchKeyword('');
    setSortOption('price_asc');
  }, []);

  const clearSearch = useCallback(() => {
    setSearchKeyword('');
  }, []);

  return {
    filters,
    searchKeyword,
    sortOption,
    applyFilters,
    updateFilter,
    setFilters,
    setSearchKeyword,
    setSortOption,
    resetFilters,
    clearSearch
  };
};
