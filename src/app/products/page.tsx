'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, getProducts } from '../../lib/firebase';
import { getMockProducts } from '../../utils/mockData';
import { FilterModal } from '../../components/FilterModal';
import { HierarchicalFilterModal } from '../../components/HierarchicalFilterModal';
import { FilterButton } from '../../components/FilterButton';
import { FilterChips } from '../../components/FilterChips';
import { Pagination } from '../../components/Pagination';
import { useFilterOptions } from '../../hooks/useFilterOptions';
import { isMatchingAny } from '../../utils/filterNormalization';

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フィルター状態（適用済み）
  const [filters, setFilters] = useState({
    maker: [] as string[],
    cpu: [] as string[],
    gpu: [] as string[],
    memory: [] as string[],
    storage: [] as string[],
    priceMin: 0,
    priceMax: 1000000,
    onSale: false
  });

  // モーダル内の一時的なフィルター状態（適用前）
  const [tempFilters, setTempFilters] = useState({
    maker: [] as string[],
    cpu: [] as string[],
    gpu: [] as string[],
    memory: [] as string[],
    storage: [] as string[]
  });

  // 検索・ソート・ページネーション状態
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('price-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 一時的な価格・検索・セール状態（検索ボタンで反映）
  const [tempSearchKeyword, setTempSearchKeyword] = useState('');
  const [tempPriceMin, setTempPriceMin] = useState(0);
  const [tempPriceMax, setTempPriceMax] = useState(1000000);
  const [tempOnSale, setTempOnSale] = useState(false);

  // モーダル状態
  const [isMakerModalOpen, setIsMakerModalOpen] = useState(false);
  const [isCpuModalOpen, setIsCpuModalOpen] = useState(false);
  const [isGpuModalOpen, setIsGpuModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // スマホでのフィルター折りたたみ状態
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // フィルターオプション（静的ファイルから取得）
  const { makerOptions, cpuOptionsHierarchy, gpuOptionsHierarchy, memoryOptions, storageOptions, isLoading: filterOptionsLoading } = useFilterOptions();

  // 価格選択肢（5万円刻み）
  const priceOptions = [
    { label: '指定なし', value: null },
    { label: '5万円', value: 50000 },
    { label: '10万円', value: 100000 },
    { label: '15万円', value: 150000 },
    { label: '20万円', value: 200000 },
    { label: '25万円', value: 250000 },
    { label: '30万円', value: 300000 },
    { label: '35万円', value: 350000 },
    { label: '40万円', value: 400000 },
    { label: '45万円', value: 450000 },
    { label: '50万円', value: 500000 },
    { label: '55万円', value: 550000 },
    { label: '60万円', value: 600000 },
    { label: '65万円', value: 650000 },
    { label: '70万円', value: 700000 },
    { label: '75万円', value: 750000 },
    { label: '80万円', value: 800000 },
    { label: '85万円', value: 850000 },
    { label: '90万円', value: 900000 },
    { label: '95万円', value: 950000 },
    { label: '100万円', value: 1000000 }
  ];

  // 初期状態をURLから復元
  useEffect(() => {
    const urlState = parseUrlParams(searchParams);
    
    setFilters(urlState.filters);
    setTempFilters({
      maker: urlState.filters.maker,
      cpu: urlState.filters.cpu,
      gpu: urlState.filters.gpu,
      memory: urlState.filters.memory,
      storage: urlState.filters.storage
    });
    setSearchKeyword(urlState.searchKeyword);
    setTempSearchKeyword(urlState.searchKeyword);
    setTempPriceMin(urlState.filters.priceMin);
    setTempPriceMax(urlState.filters.priceMax);
    setTempOnSale(urlState.filters.onSale);
    setSortBy(urlState.sortBy);
    setCurrentPage(urlState.currentPage);

    // スマホでフィルターが適用されている場合は折りたたむ
    const hasActiveFilters = Boolean(
      urlState.searchKeyword || 
      urlState.filters.maker.length > 0 ||
      urlState.filters.cpu.length > 0 ||
      urlState.filters.gpu.length > 0 ||
      urlState.filters.memory.length > 0 ||
      urlState.filters.storage.length > 0 ||
      urlState.filters.priceMin > 0 ||
      urlState.filters.priceMax < 1000000 ||
      urlState.filters.onSale
    );
    setIsFilterCollapsed(hasActiveFilters);
  }, [searchParams]);

  // データ取得
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Firebaseからデータを取得
        const firebaseProducts = await getProducts();
        
        if (firebaseProducts.length > 0) {
          console.log('Firebaseから商品データを取得:', firebaseProducts.length, '件');
          setProducts(firebaseProducts);
          setFilteredProducts(firebaseProducts);
        } else {
          console.log('Firebaseからデータが取得できませんでした。モックデータを使用します。');
          const mockData = getMockProducts();
          setProducts(mockData);
          setFilteredProducts(mockData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの読み込み中にエラーが発生しました。モックデータを表示します。');
        
        // エラー時はモックデータを使用
        const mockData = getMockProducts();
        setProducts(mockData);
        setFilteredProducts(mockData);
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // フィルター処理
  const applyFilters = () => {
    let filtered = [...products];

    // メーカーフィルター
    if (filters.maker.length > 0) {
      filtered = filtered.filter(product => 
        filters.maker.includes(product.maker)
      );
    }

    // CPUフィルター（正規化ベース）
    if (filters.cpu.length > 0) {
      filtered = filtered.filter(product => 
        isMatchingAny(filters.cpu, product.cpu)
      );
    }

    // GPUフィルター（正規化ベース）
    if (filters.gpu.length > 0) {
      filtered = filtered.filter(product => 
        isMatchingAny(filters.gpu, product.gpu)
      );
    }

    // メモリフィルター
    if (filters.memory.length > 0) {
      filtered = filtered.filter(product => 
        filters.memory.some(memory => product.memory.includes(memory))
      );
    }

    // ストレージフィルター
    if (filters.storage.length > 0) {
      filtered = filtered.filter(product => 
        filters.storage.some(storage => product.storage.includes(storage))
      );
    }

    // 価格フィルター
    filtered = filtered.filter(product => 
      product.effectiveprice >= filters.priceMin && 
      product.effectiveprice <= filters.priceMax
    );

    // セール中フィルター
    if (filters.onSale) {
      filtered = filtered.filter(product => 
        product.discountrate > 0
      );
    }

    // キーワード検索（複数キーワード対応 + 全角半角正規化）
    if (searchKeyword.trim()) {
      // 全角半角正規化関数
      const normalizeText = (text: string) => {
        return text
          .toLowerCase()
          .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
          .replace(/\s+/g, ' ')
          .trim();
      };

      // 複数キーワードをスペースで分割
      const keywords = normalizeText(searchKeyword)
        .split(' ')
        .filter(keyword => keyword.length > 0);

      filtered = filtered.filter(product => {
        // 検索対象フィールドを正規化
        const searchTargets = [
          normalizeText(product.name),
          normalizeText(product.maker),
          normalizeText(product.cpu),
          normalizeText(product.gpu)
        ].join(' ');

        // 全てのキーワードが含まれているかチェック（AND検索）
        return keywords.every(keyword => searchTargets.includes(keyword));
      });
    }

    // ソート
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.effectiveprice - b.effectiveprice);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.effectiveprice - a.effectiveprice);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'maker-asc':
        filtered.sort((a, b) => a.maker.localeCompare(b.maker));
        break;
      case 'discount-desc':
        filtered.sort((a, b) => b.discountrate - a.discountrate);
        break;
    }

    setFilteredProducts(filtered);
  };

  // ページネーション計算
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageProducts = filteredProducts.slice(startIndex, endIndex);

  // フィルタークリア（真のページリロード）
  const clearFilters = () => {
    window.location.href = '/products';
  };

  // 一時フィルター更新のヘルパー関数（適用ボタンまでは実際のfiltersを変更しない）
  const updateTempFilterValues = (type: keyof typeof tempFilters, values: string[]) => {
    setTempFilters(prev => ({
      ...prev,
      [type]: values
    }));
  };

  // フィルター適用（商品データ変更時、またはフィルター条件変更時）
  useEffect(() => {
    if (products.length > 0) {
      applyFilters();
    }
  }, [products, filters.maker, filters.cpu, filters.gpu, filters.memory, filters.storage, filters.priceMin, filters.priceMax, filters.onSale, searchKeyword, sortBy]);

  // URL管理のヘルパー関数
  const buildUrlParams = (currentFilters: typeof filters, currentSearch: string, currentSort: string, page: number = 1) => {
    const params = new URLSearchParams();
    
    if (currentSearch.trim()) {
      params.set('search', currentSearch);
    }
    
    if (currentFilters.maker.length > 0) {
      params.set('maker', currentFilters.maker.join(','));
    }
    
    if (currentFilters.cpu.length > 0) {
      params.set('cpu', currentFilters.cpu.join(','));
    }
    
    if (currentFilters.gpu.length > 0) {
      params.set('gpu', currentFilters.gpu.join(','));
    }
    
    if (currentFilters.memory.length > 0) {
      params.set('memory', currentFilters.memory.join(','));
    }
    
    if (currentFilters.storage.length > 0) {
      params.set('storage', currentFilters.storage.join(','));
    }
    
    if (currentFilters.priceMin > 0) {
      params.set('priceMin', currentFilters.priceMin.toString());
    }
    
    if (currentFilters.priceMax < 1000000) {
      params.set('priceMax', currentFilters.priceMax.toString());
    }
    
    if (currentFilters.onSale) {
      params.set('onSale', 'true');
    }
    
    if (currentSort !== 'price-asc') {
      params.set('sort', currentSort);
    }
    
    if (page > 1) {
      params.set('page', page.toString());
    }
    
    return params.toString();
  };

  const parseUrlParams = (params: URLSearchParams) => {
    return {
      filters: {
        maker: params.get('maker')?.split(',').filter(Boolean) || [],
        cpu: params.get('cpu')?.split(',').filter(Boolean) || [],
        gpu: params.get('gpu')?.split(',').filter(Boolean) || [],
        memory: params.get('memory')?.split(',').filter(Boolean) || [],
        storage: params.get('storage')?.split(',').filter(Boolean) || [],
        priceMin: parseInt(params.get('priceMin') || '0'),
        priceMax: parseInt(params.get('priceMax') || '1000000'),
        onSale: params.get('onSale') === 'true'
      },
      searchKeyword: params.get('search') || '',
      sortBy: params.get('sort') || 'price-asc',
      currentPage: parseInt(params.get('page') || '1')
    };
  };

  const updateUrl = (newFilters: typeof filters, newSearch: string, newSort: string) => {
    const urlParams = buildUrlParams(newFilters, newSearch, newSort);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  // チップ削除ハンドラー（真のページリロード）
  const handleRemoveMaker = (maker: string) => {
    const newFilters = {
      ...filters,
      maker: filters.maker.filter(m => m !== maker)
    };
    const urlParams = buildUrlParams(newFilters, searchKeyword, sortBy);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleRemoveCpu = (cpu: string) => {
    const newFilters = {
      ...filters,
      cpu: filters.cpu.filter(c => c !== cpu)
    };
    const urlParams = buildUrlParams(newFilters, searchKeyword, sortBy);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleRemoveGpu = (gpu: string) => {
    const newFilters = {
      ...filters,
      gpu: filters.gpu.filter(g => g !== gpu)
    };
    const urlParams = buildUrlParams(newFilters, searchKeyword, sortBy);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleRemoveMemory = (memory: string) => {
    const newFilters = {
      ...filters,
      memory: filters.memory.filter(m => m !== memory)
    };
    const urlParams = buildUrlParams(newFilters, searchKeyword, sortBy);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleRemoveStorage = (storage: string) => {
    const newFilters = {
      ...filters,
      storage: filters.storage.filter(s => s !== storage)
    };
    const urlParams = buildUrlParams(newFilters, searchKeyword, sortBy);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleClearSearch = () => {
    const urlParams = buildUrlParams(filters, '', sortBy);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleClearPrice = () => {
    const newFilters = {
      ...filters,
      priceMin: 0,
      priceMax: 1000000
    };
    const urlParams = buildUrlParams(newFilters, searchKeyword, sortBy);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  // モーダル適用ハンドラー（一時フィルターを適用してページリロード）
  const handleModalApply = () => {
    // 一時フィルターを実際のフィルターに反映
    const newFilters = {
      ...filters,
      maker: tempFilters.maker,
      cpu: tempFilters.cpu,
      gpu: tempFilters.gpu,
      memory: tempFilters.memory,
      storage: tempFilters.storage
    };
    
    const urlParams = buildUrlParams(newFilters, searchKeyword, sortBy, 1); // 新しい検索時は1ページ目
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    const urlParams = buildUrlParams(filters, searchKeyword, sortBy, page);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  // 商品カードコンポーネント
  const ProductCard = ({ product }: { product: Product }) => (
    <a href={product.productUrl} target="_blank" rel="nofollow sponsored" className="product-card">
      <div className="card-content">
        {/* 商品画像 */}
        <div className="card-image">
          <img 
            src={product.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+'} 
            alt={product.name}
          />
        </div>
        
        {/* 商品情報 */}
        <div className="card-info">
          <div style={{ flex: 1 }}>
            <strong>{product.name}</strong>
            <span className="maker-name">{product.maker}</span>
            
            {/* スペック情報 */}
            <div className="spec-info">
              <div className="spec-item">
                <div className="spec-label">CPU</div>
                <div className="spec-value">{product.cpu || '情報なし'}</div>
              </div>
              <div className="spec-item">
                <div className="spec-label">GPU</div>
                <div className="spec-value">{product.gpu || '情報なし'}</div>
              </div>
              <div className="spec-item">
                <div className="spec-label">メモリ</div>
                <div className="spec-value">{product.memory || '情報なし'}</div>
              </div>
              <div className="spec-item">
                <div className="spec-label">ストレージ</div>
                <div className="spec-value">{product.storage || '情報なし'}</div>
              </div>
            </div>
          </div>
          
          {/* 価格ブロック */}
          <div className="price-block">
            <div className="price-row">
              {product.price > product.effectiveprice && (
                <span className="list-price-strikethrough">
                  ¥{product.price.toLocaleString()}
                </span>
              )}
              <span className="actual-price">
                <span className="tax-included">税込</span>¥{product.effectiveprice.toLocaleString()}
              </span>
            </div>
            
            {/* バッジ */}
            <div className="badge-row">
              {product.discountrate > 0 && (
                <span className="badge discount-rate-badge">
                  {product.discountrate}%OFF
                </span>
              )}
              {(() => {
                // キャンペーンタイプをグループ化（対応済みタイプのみ）
                const campaignTypes = [...new Set(product.campaigns.map(c => c.type))];
                const hasPointCampaign = campaignTypes.includes('ポイント');
                
                // ポイント以外で対応するタイプのみフィルタ
                const allowedTypes = ['クーポン', 'セール'];
                const otherCampaigns = campaignTypes.filter(type => 
                  type !== 'ポイント' && allowedTypes.includes(type)
                );
                
                return (
                  <>
                    {hasPointCampaign && (
                      <span className="badge point-badge">
                        ポイントUP
                      </span>
                    )}
                    {otherCampaigns.map((type, index) => (
                      <span key={index} className="badge">
                        {type}
                      </span>
                    ))}
                  </>
                );
              })()}
            </div>
            
            {/* 送料とポイント還元情報 */}
            <div className="shipping-points-container">
              <div className={`shipping-fee-text ${product.shippingFee === 0 ? 'free' : ''}`}>
                {product.shippingFee === 0 
                  ? '送料 無料' 
                  : `送料 ${product.shippingFee.toLocaleString()}円`
                }
              </div>
              <div className="point-reward-text">
                {(() => {
                  const pointCampaigns = product.campaigns.filter(campaign => 
                    campaign.type === 'ポイント'
                  );
                  const campaignPoints = pointCampaigns.reduce((sum, campaign) => 
                    sum + campaign.amount, 0
                  );
                  const totalPoints = product.regularPoint + campaignPoints;
                  return `${totalPoints.toLocaleString()}ポイント還元`;
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );

  if (loading || filterOptionsLoading) {
    return (
      <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
        <div className="products-container">
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-700 mb-4">
              {loading ? 'データを読み込み中...' : 'フィルター設定を読み込み中...'}
            </div>
            <div className="text-gray-500">しばらくお待ちください</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      <div className="products-container">
        {/* ページタイトル */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">PC商品一覧</h1>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 font-semibold">⚠️ 注意</div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* フィルターエリア */}
        <div className="filter-controls">
          {/* スマホ用の折りたたみヘッダー */}
          <div className="filter-header-mobile">
            <h3>絞り込み条件</h3>
            <button
              type="button"
              className="filter-toggle-btn"
              onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
            >
              {isFilterCollapsed ? '▼' : '▲'}
            </button>
          </div>

          <div className={`filter-form-wrapper ${isFilterCollapsed ? 'collapsed' : ''}`}>
            <form className="filter-form" onSubmit={(e) => { 
              e.preventDefault(); 
              // 一時フィルターも含めて全て適用してページリロード
              const allFilters = {
                ...filters,
                maker: tempFilters.maker,
                cpu: tempFilters.cpu,
                gpu: tempFilters.gpu,
                memory: tempFilters.memory,
                storage: tempFilters.storage,
                priceMin: tempPriceMin,
                priceMax: tempPriceMax,
                onSale: tempOnSale
              };
              const urlParams = buildUrlParams(allFilters, tempSearchKeyword, sortBy, 1); // 新しい検索時は1ページ目
              const newUrl = urlParams ? `/products?${urlParams}` : '/products';
              window.location.href = newUrl;
            }}>
            {/* 1行目: フィルターボタン行 */}
            <div className="filter-section">
              <h3 className="filter-section-title">絞り込み条件</h3>
              <div className="filter-buttons-row">
                {/* メーカーボタン */}
                <FilterButton
                  label="メーカー"
                  selectedCount={tempFilters.maker.length}
                  onClick={() => setIsMakerModalOpen(true)}
                />

                {/* CPUボタン */}
                <FilterButton
                  label="CPU"
                  selectedCount={tempFilters.cpu.length}
                  onClick={() => setIsCpuModalOpen(true)}
                />

                {/* GPUボタン */}
                <FilterButton
                  label="GPU"
                  selectedCount={tempFilters.gpu.length}
                  onClick={() => setIsGpuModalOpen(true)}
                />

                {/* メモリボタン */}
                <FilterButton
                  label="メモリ"
                  selectedCount={tempFilters.memory.length}
                  onClick={() => setIsMemoryModalOpen(true)}
                />

                {/* ストレージボタン */}
                <FilterButton
                  label="ストレージ"
                  selectedCount={tempFilters.storage.length}
                  onClick={() => setIsStorageModalOpen(true)}
                />
              </div>
            </div>

            {/* 2行目: 価格範囲と検索窓とボタン */}
            <div className="filter-section">
              <div className="price-search-buttons-row">
                {/* 価格範囲 */}
                <div className="price-range-compact">
                  <div className="price-box-styled">
                    <span className="filter-label">価格</span>
                    <div className="price-selects-styled">
                      <select 
                        className="price-select-styled"
                        value={tempPriceMin || ''}
                        onChange={(e) => setTempPriceMin(e.target.value ? parseInt(e.target.value) : 0)}
                      >
                        {priceOptions.map((option) => (
                          <option key={option.label} value={option.value || ''}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      
                      <span className="price-separator-styled">〜</span>
                      
                      <select 
                        className="price-select-styled"
                        value={tempPriceMax === 1000000 ? '' : tempPriceMax}
                        onChange={(e) => setTempPriceMax(e.target.value ? parseInt(e.target.value) : 1000000)}
                      >
                        {priceOptions.map((option) => (
                          <option key={option.label} value={option.value || ''}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 検索窓 */}
                <div className="search-compact">
                  <div className="search-box-styled">
                    <span className="filter-label">検索</span>
                    <input
                      type="text"
                      className="search-input-styled"
                      placeholder="商品名、スペックなど"
                      value={tempSearchKeyword}
                      onChange={(e) => setTempSearchKeyword(e.target.value)}
                    />
                  </div>
                </div>



                {/* フィルターボタン */}
                <div className="filter-buttons-inline">
                  <button type="button" className="filter-clear" onClick={clearFilters}>クリア</button>
                  <button type="submit" className="filter-submit">検索</button>
                </div>
              </div>
            </div>
            </form>
          </div>

          {/* フィルターチップ（適用済み条件がある場合のみ表示） */}
          {searchParams.toString() && (
            <FilterChips
              searchKeyword={searchKeyword}
              onClearSearch={handleClearSearch}
              selectedMakers={filters.maker}
              selectedCpus={filters.cpu}
              selectedGpus={filters.gpu}
              selectedMemory={filters.memory}
              selectedStorage={filters.storage}
              priceMin={filters.priceMin}
              priceMax={filters.priceMax}
              onRemoveMaker={handleRemoveMaker}
              onRemoveCpu={handleRemoveCpu}
              onRemoveGpu={handleRemoveGpu}
                          onRemoveMemory={handleRemoveMemory}
            onRemoveStorage={handleRemoveStorage}
            onClearPrice={handleClearPrice}
            />
          )}
        </div>

        {/* 検索結果とソート・SALEボタンの配置 */}
        <div className="results-and-sort-header">
          {/* 左端の検索結果表示 */}
          <div className="results-count">
            <span className="text-gray-600">
              検索結果 <span className="font-semibold text-gray-900">{filteredProducts.length.toLocaleString()}</span>件
              {searchKeyword && (
                <span className="ml-2 text-sm text-gray-500">
                  （「{searchKeyword}」で検索）
                </span>
              )}
            </span>
          </div>
          
          {/* 右端のSALEボタンとソート */}
          <div className="results-sort-right">
            {/* SALEボタン */}
            <div className="sale-toggle-inline">
              <button 
                type="button"
                className={`sale-button ${filters.onSale ? 'active' : ''}`}
                onClick={() => {
                  const newOnSale = !filters.onSale;
                  setFilters(prev => ({ ...prev, onSale: newOnSale }));
                }}
              >
                🔥SALE開催中
              </button>
            </div>
            
            {/* ソートセレクター */}
            <div className="sort-selector-inline">
              <span className="sort-label">並び順：</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="price-asc">価格安い順</option>
                <option value="price-desc">価格高い順</option>
                <option value="discount-desc">値下げ率順</option>
                <option value="name-asc">商品名順</option>
                <option value="maker-asc">メーカー順</option>
              </select>
            </div>
          </div>
        </div>

        {/* 商品一覧 */}
        <div className="product-list">
          {currentPageProducts.length > 0 ? (
            currentPageProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 text-xl mb-2">該当する商品が見つかりませんでした</div>
              <p className="text-gray-400">フィルター条件を変更してお試しください</p>
              <button 
                onClick={clearFilters}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                フィルターをクリア
              </button>
            </div>
          )}
        </div>

        {/* ページネーション */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />

        {/* モーダル群 */}
        <FilterModal
          isOpen={isMakerModalOpen}
          onClose={() => setIsMakerModalOpen(false)}
          title="メーカー"
          options={makerOptions}
          selectedValues={tempFilters.maker}
          onSelectionChange={(values) => updateTempFilterValues('maker', values)}
          onApply={handleModalApply}
        />

        <HierarchicalFilterModal
          isOpen={isCpuModalOpen}
          onClose={() => setIsCpuModalOpen(false)}
          title="CPU"
          hierarchyOptions={cpuOptionsHierarchy}
          selectedValues={tempFilters.cpu}
          onSelectionChange={(values) => updateTempFilterValues('cpu', values)}
          onApply={handleModalApply}
        />

        <HierarchicalFilterModal
          isOpen={isGpuModalOpen}
          onClose={() => setIsGpuModalOpen(false)}
          title="GPU"
          hierarchyOptions={gpuOptionsHierarchy}
          selectedValues={tempFilters.gpu}
          onSelectionChange={(values) => updateTempFilterValues('gpu', values)}
          onApply={handleModalApply}
        />

        <FilterModal
          isOpen={isMemoryModalOpen}
          onClose={() => setIsMemoryModalOpen(false)}
          title="メモリ"
          options={memoryOptions}
          selectedValues={tempFilters.memory}
          onSelectionChange={(values) => updateTempFilterValues('memory', values)}
          onApply={handleModalApply}
        />

        <FilterModal
          isOpen={isStorageModalOpen}
          onClose={() => setIsStorageModalOpen(false)}
          title="ストレージ"
          options={storageOptions}
          selectedValues={tempFilters.storage}
          onSelectionChange={(values) => updateTempFilterValues('storage', values)}
          onApply={handleModalApply}
        />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
