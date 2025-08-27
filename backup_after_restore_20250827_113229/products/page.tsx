'use client';

import { useState, useEffect, Suspense } from 'react';
import { ProductCard } from '../../components/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { useFilters } from '../../hooks/useFilters';
import { usePagination } from '../../hooks/usePagination';
import { useURLSync } from '../../hooks/useURLSync';
import { MAKERS, CPU_GENERATIONS, GPU_SERIES, MEMORY_SIZES, STORAGE_SIZES } from '../../utils/filterUtils';

// ローディングコンポーネント
function ProductsLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">商品を読み込み中...</p>
        </div>
      </div>
    </div>
  );
}

// メインコンテンツコンポーネント（useSearchParamsを使用）
function ProductsContent() {
  // カスタムフックの使用
  const { products, allProducts, loading, error, retryLoadProducts, updateProducts } = useProducts();
  const { 
    filters, 
    searchKeyword, 
    sortOption, 
    applyFilters, 
    setFilters, 
    setSearchKeyword, 
    setSortOption, 
    resetFilters
  } = useFilters(allProducts);
  const { 
    currentPage, 
    getPaginationInfo, 
    getPaginatedProducts, 
    changePage, 
    resetPage 
  } = usePagination(20);
  const { updateURLParams, getURLParamsFromState, parseURLParams } = useURLSync();

  // 価格オプション（10万円〜80万円、5万円刻み）
  const PRICE_OPTIONS = [
    100000, 150000, 200000, 250000, 300000, 350000, 400000, 
    450000, 500000, 550000, 600000, 650000, 700000, 750000, 800000
  ];

  // モーダル状態
  const [showMakerModal, setShowMakerModal] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);

  // URLパラメータから初期状態を復元
  useEffect(() => {
    const urlParams = parseURLParams();
    if (urlParams.keyword) setSearchKeyword(urlParams.keyword);
    if (urlParams.sort) setSortOption(urlParams.sort);
    if (urlParams.page) changePage(urlParams.page);
    if (urlParams.filters) setFilters(urlParams.filters);
  }, [parseURLParams, setSearchKeyword, setSortOption, changePage, setFilters]);

  // フィルター適用とページネーション
  useEffect(() => {
    if (allProducts.length > 0) {
      const filteredProducts = applyFilters();
      const paginatedProducts = getPaginatedProducts(filteredProducts);
      updateProducts(paginatedProducts);
    }
  }, [allProducts, filters, searchKeyword, sortOption, currentPage, applyFilters, getPaginatedProducts, updateProducts]);

  // URL同期
  useEffect(() => {
    const urlParams = getURLParamsFromState(searchKeyword, sortOption, currentPage, filters);
    updateURLParams(urlParams);
  }, [searchKeyword, sortOption, currentPage, filters, getURLParamsFromState, updateURLParams]);

  // フィルター適用関数
  const applySearchAndFilters = () => {
    resetPage();
  };

  // ページネーション情報
  const paginationInfo = getPaginationInfo(applyFilters());

  if (loading) {
    return <ProductsLoading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-red-800 mb-2">エラーが発生しました</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={retryLoadProducts}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container">
        {/* ページタイトル */}
        <h1 className="page-title">PC商品一覧</h1>

        {/* エラーメッセージ */}
        {error && (
          <div className="warning-message">
            <p>{error}</p>
            <p>仮のデータを表示しています。</p>
          </div>
        )}

                {/* フィルターUI */}
        <div className="filter-container">
          {/* 1行目: メーカー、スペック、キーワード */}
          <div className="filter-row filter-row-main">
            
            {/* メーカー */}
            <div>
              <button 
                type="button" 
                onClick={() => setShowMakerModal(true)}
                className="filter-button"
              >
                <span className="filter-button-text">
                  メーカー
                </span>
                <span className="filter-button-arrow">▼</span>
              </button>
            </div>
            
            {/* スペック */}
            <div>
              <button 
                type="button" 
                onClick={() => setShowSpecModal(true)}
                className="filter-button"
              >
                <span className="filter-button-text">
                  スペック
                </span>
                <span className="filter-button-arrow">▼</span>
              </button>
            </div>
            
            {/* キーワード */}
            <div>
              <button 
                type="button" 
                className="filter-button filter-button-disabled"
              >
                <span className="filter-button-text">
                  キーワード
                </span>
                <input 
                  type="text" 
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      applySearchAndFilters();
                    }
                  }}
                  placeholder="商品名、スペックなど" 
                  className="search-input"
                />
              </button>
            </div>
            
          </div>
          
          {/* 2行目: 価格範囲、クリア、検索 */}
          <div className="filter-row filter-row-price">
            
            {/* 価格範囲 */}
            <div className="price-controls">
              <span className="filter-label">価格</span>
              <div className="price-input-group">
                <select
                  value={filters.priceMin}
                  onChange={(e) => setFilters({...filters, priceMin: parseInt(e.target.value)})}
                  className="price-select"
                >
                  {PRICE_OPTIONS.map(price => (
                    <option key={price} value={price}>
                      {(price / 10000).toFixed(0)}万円
                    </option>
                  ))}
                </select>
                <span className="price-separator">〜</span>
                <select
                  value={filters.priceMax}
                  onChange={(e) => setFilters({...filters, priceMax: parseInt(e.target.value)})}
                  className="price-select"
                >
                  {PRICE_OPTIONS.map(price => (
                    <option key={price} value={price}>
                      {(price / 10000).toFixed(0)}万円
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* ボタングループ */}
            <div className="filter-button-group">
              <button 
                onClick={() => {
                  resetFilters();
                  resetPage();
                }}
                className="btn-secondary"
              >
                クリア
              </button>
              <button 
                onClick={applySearchAndFilters}
                className="btn-primary"
              >
                検索
              </button>
            </div>
            
          </div>
        </div>

        {/* ソートセレクター */}
        <div className="product-header">
          <div className="product-count">
            <span className="product-count-number">{paginationInfo.totalItems}</span>件の商品
          </div>
          <div className="sort-container">
            <span className="sort-label">並び替え:</span>
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                resetPage();
              }}
              className="sort-select"
            >
              <option value="price_asc">価格安い順</option>
              <option value="price_desc">価格高い順</option>
              <option value="newest">新着順</option>
            </select>
          </div>
        </div>

        {/* 商品一覧 */}
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* ページネーション */}
        {paginationInfo.totalPages > 1 && (
          <div className="pagination-container">
            {paginationInfo.hasPrevPage && (
              <button
                onClick={() => changePage(currentPage - 1)}
                className="pagination-button"
              >
                前へ
              </button>
            )}
            
            {Array.from({ length: paginationInfo.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => changePage(page)}
                className={`pagination-button ${page === currentPage ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
            
            {paginationInfo.hasNextPage && (
              <button
                onClick={() => changePage(currentPage + 1)}
                className="pagination-button"
              >
                次へ
              </button>
            )}
          </div>
        )}

        {/* メーカー選択モーダル */}
        {showMakerModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button 
                onClick={() => setShowMakerModal(false)}
                className="modal-close"
              >
                &times;
              </button>
              <h2 className="modal-header">メーカーを選択</h2>
              <div className="filter-options-grid">
                {MAKERS.map(maker => (
                  <label key={maker} className="filter-option-label">
                    <input
                      type="checkbox"
                      checked={filters.maker.includes(maker)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({...filters, maker: [...filters.maker, maker]});
                        } else {
                          setFilters({...filters, maker: filters.maker.filter(m => m !== maker)});
                        }
                      }}
                      className="filter-option-checkbox"
                    />
                    {maker}
                  </label>
                ))}
              </div>
              <div className="modal-button-group">
                <button 
                  onClick={() => {
                    setShowMakerModal(false);
                    applySearchAndFilters();
                  }}
                  className="btn-apply"
                >
                  適用
                </button>
              </div>
            </div>
          </div>
        )}

        {/* スペック選択モーダル */}
        {showSpecModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button 
                onClick={() => setShowSpecModal(false)}
                className="modal-close"
              >
                &times;
              </button>
              <h2 className="modal-header">スペックを選択</h2>
              
              {/* CPU */}
              <div className="filter-section">
                <h3>CPU</h3>
                <div className="filter-options">
                  {CPU_GENERATIONS.map(cpu => (
                    <label key={cpu} className="filter-option">
                      <input
                        type="checkbox"
                        checked={filters.cpu.includes(cpu)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, cpu: [...filters.cpu, cpu]});
                          } else {
                            setFilters({...filters, cpu: filters.cpu.filter(c => c !== cpu)});
                          }
                        }}
                        className="filter-checkbox"
                      />
                      {cpu}
                    </label>
                  ))}
                </div>
              </div>

              {/* GPU */}
              <div className="filter-section">
                <h3>GPU</h3>
                <div className="filter-options">
                  {GPU_SERIES.map(gpu => (
                    <label key={gpu} className="filter-option">
                      <input
                        type="checkbox"
                        checked={filters.gpu.includes(gpu)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, gpu: [...filters.gpu, gpu]});
                          } else {
                            setFilters({...filters, gpu: filters.gpu.filter(g => g !== gpu)});
                          }
                        }}
                        className="filter-checkbox"
                      />
                      {gpu}
                    </label>
                  ))}
                </div>
              </div>

              {/* メモリ */}
              <div className="filter-section">
                <h3>メモリ</h3>
                <div className="filter-options">
                  {MEMORY_SIZES.map(memory => (
                    <label key={memory} className="filter-option">
                      <input
                        type="checkbox"
                        checked={filters.memory.includes(memory)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, memory: [...filters.memory, memory]});
                          } else {
                            setFilters({...filters, memory: filters.memory.filter(m => m !== memory)});
                          }
                        }}
                        className="filter-checkbox"
                      />
                      {memory}
                    </label>
                  ))}
                </div>
              </div>

              {/* ストレージ */}
              <div className="filter-section">
                <h3>ストレージ</h3>
                <div className="filter-options">
                  {STORAGE_SIZES.map(storage => (
                    <label key={storage} className="filter-option">
                      <input
                        type="checkbox"
                        checked={filters.storage.includes(storage)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, storage: [...filters.storage, storage]});
                          } else {
                            setFilters({...filters, storage: filters.storage.filter(s => s !== storage)});
                          }
                        }}
                        className="filter-checkbox"
                      />
                      {storage}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-button-group">
                <button 
                  onClick={() => {
                    setShowSpecModal(false);
                    applySearchAndFilters();
                  }}
                  className="btn-apply"
                >
                  適用
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
}
