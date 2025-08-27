import { useState, useCallback } from 'react';
import { Product, PaginationInfo } from '../types/product';

export const usePagination = (itemsPerPage: number = 20) => {
  const [currentPage, setCurrentPage] = useState(1);

  const getPaginationInfo = useCallback((filteredProducts: Product[]): PaginationInfo => {
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // 現在のページが総ページ数を超えている場合は最後のページに調整
    const adjustedPage = Math.min(currentPage, totalPages || 1);
    const startIndex = (adjustedPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    return {
      totalItems,
      totalPages,
      currentPage: adjustedPage,
      startIndex: startIndex + 1,
      endIndex,
      hasNextPage: adjustedPage < totalPages,
      hasPrevPage: adjustedPage > 1
    };
  }, [currentPage, itemsPerPage]);

  const getPaginatedProducts = useCallback((filteredProducts: Product[]): Product[] => {
    const paginationInfo = getPaginationInfo(filteredProducts);
    const startIndex = (paginationInfo.currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [getPaginationInfo, itemsPerPage]);

  const changePage = useCallback((page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  }, [currentPage]);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    getPaginationInfo,
    getPaginatedProducts,
    changePage,
    resetPage,
    setCurrentPage
  };
};
