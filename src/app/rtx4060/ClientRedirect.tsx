'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { Product, getProducts, logCustomEvent } from '../../lib/firebase';
import { getMockProducts } from '../../utils/mockData';
import { FilterModal } from '../../components/FilterModal';
import { HierarchicalFilterModal } from '../../components/HierarchicalFilterModal';
import { FilterButton } from '../../components/FilterButton';
import { FilterChips } from '../../components/FilterChips';
import { Pagination } from '../../components/Pagination';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useFilterOptions } from '../../hooks/useFilterOptions';
import { isMatchingAny } from '../../utils/filterNormalization';

function Rtx4060PageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // RTX4060 専用の初期フィルター（GPU固定、デスクトップのみ、価格安い順）
  const [filterState, setFilterState] = useState({
    applied: {
      maker: [] as string[],
      cpu: [] as string[],
      gpu: ['RTX 4060 (8GB)'] as string[],
      memory: [] as string[],
      storage: [] as string[],
      showDesktop: true,
      showNotebook: false,
      priceMin: 0,
      priceMax: 1000000,
      onSale: false,
      searchKeyword: '',
      sortBy: 'price-asc'
    },
    draft: {
      maker: [] as string[],
      cpu: [] as string[],
      gpu: ['RTX 4060 (8GB)'] as string[],
      memory: [] as string[],
      storage: [] as string[],
      showDesktop: true,
      showNotebook: false,
      priceMin: 0,
      priceMax: 1000000,
      onSale: false,
      searchKeyword: ''
    }
  });

  // ページビューイベント
  useEffect(() => {
    if (typeof window !== 'undefined') {
      logCustomEvent('page_view', {
        page_name: 'rtx4060',
        page_title: 'RTX 4060 (8GB) | 最安値・安い順',
        current_filters: filterState.applied
      });
    }
  }, []);

  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // モーダル状態
  const [isMakerModalOpen, setIsMakerModalOpen] = useState(false);
  const [isCpuModalOpen, setIsCpuModalOpen] = useState(false);
  const [isGpuModalOpen, setIsGpuModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  const isAnyModalOpen = isMakerModalOpen || isCpuModalOpen || isGpuModalOpen || isMemoryModalOpen || isStorageModalOpen;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAnyModalOpen]);

  // SP検知
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // フィルター選択肢
  const { makerOptions, cpuOptionsHierarchy, gpuOptionsHierarchy, memoryOptions, storageOptions, isLoading: filterOptionsLoading } = useFilterOptions();

  // データ取得
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const firebaseProducts = await getProducts();
        if (firebaseProducts.length > 0) {
          setProducts(firebaseProducts);
          setFilteredProducts(firebaseProducts);
        } else {
          const mockData = getMockProducts();
          setProducts(mockData);
          setFilteredProducts(mockData);
        }
        setLoading(false);
      } catch (err) {
        setError('データの読み込み中にエラーが発生しました。モックデータを表示します。');
        const mockData = getMockProducts();
        setProducts(mockData);
        setFilteredProducts(mockData);
        setLoading(false);
      }
    };
    load();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...products];
    const { applied } = filterState;

    // メーカー
    if (applied.maker.length > 0) {
      filtered = filtered.filter(p => applied.maker.includes(p.maker));
    }

    // 形状（デスクトップ固定ON, ノートはOFF）
    const effectiveShapes: string[] = [];
    if (applied.showDesktop) effectiveShapes.push('デスクトップ');
    if (applied.showNotebook) effectiveShapes.push('ノートブック');
    if (effectiveShapes.length > 0) {
      filtered = filtered.filter(product => {
        return effectiveShapes.some(shape => {
          if (shape === 'デスクトップ') {
            return product.type === 'デスクトップ' || product.category === 'desktop';
          } else if (shape === 'ノートブック') {
            return product.type === 'ノートブック' || product.category === 'notebook';
          }
          return false;
        });
      });
    }

    // CPU
    if (applied.cpu.length > 0) {
      filtered = filtered.filter(product => isMatchingAny(applied.cpu, product.cpu));
    }

    // GPU（RTX4060固定初期値）
    if (applied.gpu.length > 0) {
      filtered = filtered.filter(product => isMatchingAny(applied.gpu, product.gpu));
    }

    // メモリ
    if (applied.memory.length > 0) {
      filtered = filtered.filter(product => applied.memory.some(m => product.memory.includes(m)));
    }

    // ストレージ
    if (applied.storage.length > 0) {
      filtered = filtered.filter(product => applied.storage.some(s => product.storage.includes(s)));
    }

    // 価格
    filtered = filtered.filter(product => product.effectiveprice >= applied.priceMin && product.effectiveprice <= applied.priceMax);

    // セール
    if (applied.onSale) {
      filtered = filtered.filter(product => product.discountrate > 0);
    }

    // ソート
    switch (applied.sortBy) {
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
    document.title = 'RTX 4060 (8GB)搭載PC 最安値・安い順 | イヤバズnavi';
  }, [products, filterState]);

  useEffect(() => {
    if (products.length > 0) {
      applyFilters();
    }
  }, [applyFilters, products.length]);

  useEffect(() => {
    document.title = 'RTX 4060 (8GB)搭載PC 最安値・安い順 | イヤバズnavi';
  }, []);

  // URLビルド（遷移は常に /db/search へ）
  const buildUrlParams = (currentFilters: typeof filterState.applied, page: number = 1) => {
    const params = new URLSearchParams();
    if (currentFilters.searchKeyword.trim()) params.set('keyword', currentFilters.searchKeyword);
    if (currentFilters.maker.length > 0) params.set('maker', currentFilters.maker.join(','));
    if (currentFilters.cpu.length > 0) params.set('cpu', currentFilters.cpu.join(','));
    if (currentFilters.gpu.length > 0) params.set('gpu', currentFilters.gpu.join(','));
    if (currentFilters.memory.length > 0) params.set('memory', currentFilters.memory.join(','));
    if (currentFilters.storage.length > 0) params.set('storage', currentFilters.storage.join(','));
    if (currentFilters.priceMin > 0) params.set('priceMin', String(currentFilters.priceMin));
    if (currentFilters.priceMax < 1000000) params.set('priceMax', String(currentFilters.priceMax));
    if (currentFilters.onSale) params.set('onSale', 'true');
    const plusItems = [] as string[];
    if (currentFilters.showDesktop) plusItems.push('desktop');
    if (currentFilters.showNotebook) plusItems.push('notebook');
    if (!(plusItems.length === 1 && plusItems[0] === 'desktop')) params.set('plus', plusItems.join(','));
    if (currentFilters.sortBy !== 'price-asc') params.set('sort', currentFilters.sortBy);
    if (page > 1) params.set('page', String(page));
    return params.toString();
  };

  const clearFilters = () => {
    window.location.href = '/db/search';
  };

  const updateDraftFilterValues = (type: keyof typeof filterState.draft, values: string[]) => {
    setFilterState(prev => ({ ...prev, draft: { ...prev.draft, [type]: values } }));
  };

  const handleRemoveMaker = (maker: string) => {
    const newFilters = { ...filterState.applied, maker: filterState.applied.maker.filter(m => m !== maker) };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };
  const handleRemoveCpu = (cpu: string) => {
    const newFilters = { ...filterState.applied, cpu: filterState.applied.cpu.filter(c => c !== cpu) };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };
  const handleRemoveGpu = (gpu: string) => {
    const newFilters = { ...filterState.applied, gpu: filterState.applied.gpu.filter(g => g !== gpu) };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };
  const handleRemoveMemory = (memory: string) => {
    const newFilters = { ...filterState.applied, memory: filterState.applied.memory.filter(m => m !== memory) };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };
  const handleRemoveStorage = (storage: string) => {
    const newFilters = { ...filterState.applied, storage: filterState.applied.storage.filter(s => s !== storage) };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };
  const handleClearSearch = () => {
    const newFilters = { ...filterState.applied, searchKeyword: '' };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };
  const handleClearPrice = () => {
    const newFilters = { ...filterState.applied, priceMin: 0, priceMax: 1000000 };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };

  const handleModalApply = () => {
    const newFilters = {
      ...filterState.applied,
      maker: filterState.draft.maker,
      cpu: filterState.draft.cpu,
      gpu: filterState.draft.gpu,
      memory: filterState.draft.memory,
      storage: filterState.draft.storage
    };
    logCustomEvent('search', buildFilterAnalyticsPayload(newFilters, 1));
    const urlParams = buildUrlParams(newFilters, 1);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };

  const handlePageChange = (page: number) => {
    const urlParams = buildUrlParams(filterState.applied, page);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };

  const buildFilterAnalyticsPayload = (currentFilters: typeof filterState.applied, page: number = 1) => {
    const plusItems: string[] = [];
    if (currentFilters.showDesktop) plusItems.push('desktop');
    if (currentFilters.showNotebook) plusItems.push('notebook');
    const priceRange = currentFilters.priceMin === 0 && currentFilters.priceMax === 1000000 ? 'all' : `${currentFilters.priceMin}-${currentFilters.priceMax}`;
    const filtersSummary = [
      `maker=${currentFilters.maker.slice(0, 5).join(',') || '(none)'}`,
      `cpu=${currentFilters.cpu.slice(0, 5).join(',') || '(none)'}`,
      `gpu=${currentFilters.gpu.slice(0, 5).join(',') || '(none)'}`,
      `mem=${currentFilters.memory.slice(0, 5).join(',') || '(none)'}`,
      `sto=${currentFilters.storage.slice(0, 5).join(',') || '(none)'}`,
      `price=${priceRange}`,
      `plus=${plusItems.join(',') || 'desktop'}`,
      `on_sale=${String(currentFilters.onSale)}`,
      `kw=${currentFilters.searchKeyword ? 'yes' : 'no'}`,
      `sort=${currentFilters.sortBy}`,
      `page=${page}`
    ].join('|');
    return {
      search_keyword: currentFilters.searchKeyword,
      maker_count: currentFilters.maker.length,
      cpu_count: currentFilters.cpu.length,
      gpu_count: currentFilters.gpu.length,
      memory_count: currentFilters.memory.length,
      storage_count: currentFilters.storage.length,
      price_min: currentFilters.priceMin,
      price_max: currentFilters.priceMax,
      show_desktop: currentFilters.showDesktop,
      show_notebook: currentFilters.showNotebook,
      on_sale: currentFilters.onSale,
      total_filters: Object.keys(currentFilters).length,
      maker_values: currentFilters.maker.join(',') || '(none)',
      cpu_values: currentFilters.cpu.join(',') || '(none)',
      gpu_values: currentFilters.gpu.join(',') || '(none)',
      memory_values: currentFilters.memory.join(',') || '(none)',
      storage_values: currentFilters.storage.join(',') || '(none)',
      price_range: priceRange,
      plus: plusItems.join(',') || 'desktop',
      sort_type: currentFilters.sortBy,
      page,
      filters_applied: filtersSummary
    } as const;
  };

  // チップ表示判定（初期でもGPU選択があるためtrue）
  const hasActiveFilters = (
    filterState.applied.searchKeyword.trim() !== '' ||
    filterState.applied.maker.length > 0 ||
    filterState.applied.cpu.length > 0 ||
    filterState.applied.gpu.length > 0 ||
    filterState.applied.memory.length > 0 ||
    filterState.applied.storage.length > 0 ||
    filterState.applied.priceMin > 0 ||
    filterState.applied.priceMax < 1000000 ||
    filterState.applied.onSale ||
    !(filterState.applied.showDesktop && !filterState.applied.showNotebook)
  );

  if (loading || filterOptionsLoading) {
    return <LoadingSpinner type={loading ? 'data' : 'filter'} />;
  }

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageProducts = filteredProducts.slice(startIndex, endIndex);

  // フィルター結果内の上位3件（価格安い順）を特定して順位マップを作成（このURLのみ）
  const rankById = (() => {
    if (filteredProducts.length === 0) return new Map<string, number>();
    const sorted = [...filteredProducts]
      .sort((a, b) => {
        if (a.effectiveprice !== b.effectiveprice) return a.effectiveprice - b.effectiveprice;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 3)
      .map(p => p.id);
    return new Map<string, number>(sorted.map((id, idx) => [id, idx])); // 0,1,2
  })();

  // オリジナルSVGメダル（rank: 0=金,1=銀,2=銅）
  const renderMedal = (rank: number, size: number, uid: string) => {
    const variant = rank === 0 ? 'gold' : rank === 1 ? 'silver' : 'bronze';
    const num = rank + 1;
    const palette = {
      gold: { base: '#F5C542', dark: '#D9A014', ring: '#B58300', ribbon: '#EAB308' },
      silver: { base: '#C0C4CC', dark: '#8F949B', ring: '#6B7280', ribbon: '#9CA3AF' },
      bronze: { base: '#C97A35', dark: '#8C4B23', ring: '#7C3E1D', ribbon: '#B45309' }
    } as const;
    const colors = palette[variant as keyof typeof palette];
    const gradId = `medal_grad_${variant}_${uid}`;
    const vb = 64; // viewBox基準
    const scale = size / vb;
    // 月桂冠（左右アークの楕円リーフ）
    // 円の縁に沿って「下(90°)から上(-90°)」へ左右に伸びる配置
    const makeAngles = (start: number, end: number, steps: number) =>
      Array.from({ length: steps }, (_ , i) => start + (end - start) * (i / (steps - 1)));
    const leftAngles = makeAngles(100, 260, 14);   // 左側：やや下(100°) → 上寄り(260°≒-100°)
    const rightAngles = makeAngles(80, -80, 14);  // 右側：やや下(80°) → 上寄り(-80°)
    const leafRadius = 21; // 葉の軌道半径（外周に沿わせる）
    return (
      <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} role="img" aria-label={`${num}位`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={gradId} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={colors.base} stopOpacity="1" />
            <stop offset="70%" stopColor={colors.base} stopOpacity="0.9" />
            <stop offset="100%" stopColor={colors.dark} stopOpacity="1" />
          </radialGradient>
        </defs>
        {/* メダル円 */}
        <circle cx="32" cy="32" r="23" fill={`url(#${gradId})`} stroke={colors.ring} strokeWidth="3" />
        {/* 月桂冠（左右） */}
        <g fill="#FFFFFF" fillOpacity="0.85">
          {leftAngles.map((a, idx) => {
            const rad = (Math.PI / 180) * a;
            const x = 32 + leafRadius * Math.cos(rad);
            const y = 32 + leafRadius * Math.sin(rad);
            // 下側は大きく、上側に行くほど小さくスケール
            const minScale = 0.65;
            const bottomY = 32 + leafRadius; // 下端
            const topY = 32 - leafRadius;    // 上端
            const t = (y - topY) / (bottomY - topY); // 0(上)→1(下)
            const s = minScale + (1 - minScale) * Math.max(0, Math.min(1, t));
            return <ellipse key={`l_${idx}`} cx={x} cy={y} rx={2.2 * s} ry={4.6 * s} transform={`rotate(${a + 90} ${x} ${y})`} />;
          })}
          {rightAngles.map((a, idx) => {
            const rad = (Math.PI / 180) * a;
            const x = 32 + leafRadius * Math.cos(rad);
            const y = 32 + leafRadius * Math.sin(rad);
            const minScale = 0.65;
            const bottomY = 32 + leafRadius;
            const topY = 32 - leafRadius;
            const t = (y - topY) / (bottomY - topY);
            const s = minScale + (1 - minScale) * Math.max(0, Math.min(1, t));
            return <ellipse key={`r_${idx}`} cx={x} cy={y} rx={2.2 * s} ry={4.6 * s} transform={`rotate(${a - 90} ${x} ${y})`} />;
          })}
        </g>
        {/* 斜めのブックマーク型リボン（Vノッチ） */}
        <g>
          {/* 左リボン（ハの字：外側に開くように右上がり） */}
          <g transform="translate(18 44) rotate(20 0 0)">
            <path d="M0 0 L10 0 L10 18 L5 13 L0 18 Z" fill={colors.ribbon} stroke={colors.ring} strokeWidth="0.5" />
          </g>
          {/* 右リボン（外側に開くように左上がり） */}
          <g transform="translate(46 44) rotate(-20 0 0)">
            <path d="M0 0 L-10 0 L-10 18 L-5 13 L0 18 Z" fill={colors.ribbon} stroke={colors.ring} strokeWidth="0.5" />
          </g>
        </g>
        {/* 中央数字 */}
        <text x="32" y="36" textAnchor="middle" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans JP', sans-serif" fontSize="20" fontWeight="800" fill="#ffffff" stroke="#000000" strokeOpacity="0.25" strokeWidth="1">
          {num}
        </text>
      </svg>
    );
  };

  const shouldShowNew = (product: Product) => {
    if ((product as any).suppressNew === true) return false;
    if (!product.createdAt) return false;
    const created = product.createdAt instanceof Date ? product.createdAt : new Date(product.createdAt as any);
    if (isNaN(created.getTime())) return false;
    const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
    return (Date.now() - created.getTime()) <= FOURTEEN_DAYS_MS;
  };

  const ProductCardCmp = ({ product }: { product: Product }) => (
    <a href={product.productUrl} target="_blank" rel="nofollow sponsored" className="product-card" onClick={() => logCustomEvent('click', {
      item_id: product.id,
      item_name: product.name,
      item_maker: product.maker,
      item_price: product.price,
      item_effective_price: product.effectiveprice,
      item_discount_rate: product.discountrate,
      item_cpu: product.cpu,
      item_gpu: product.gpu,
      item_memory: product.memory,
      item_storage: product.storage,
      item_type: product.type,
      current_page: currentPage,
      current_sort: filterState.applied.sortBy
    })}>
      <div className="card-content">
        <div className="card-header">
          <strong>{shouldShowNew(product) && (<span className="new-prefix" title="掲載から7日以内">NEW!</span>)}{product.name}</strong>
          <span className="maker-name">{product.maker}</span>
        </div>
        <div className="card-body">
          <div className="card-image" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
            {/* 左上：順位丸アイコン（1/2/3） */}
            {(() => {
              const rank = rankById.get(product.id);
              if (rank === undefined) return null;
              const size = isMobile ? 40 : 48;
              return (
                <span style={{ position: 'absolute', top: '8px', left: '8px', pointerEvents: 'none', zIndex: 2 }}>
                  {renderMedal(rank, size, product.id)}
                </span>
              );
            })()}
            <img src={product.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+'} alt={product.name} style={{ display: 'block' }} />
          </div>
          <div className="card-info">
            <div className="pc-only-header">
              <strong>{shouldShowNew(product) && (<span className="new-prefix" title="掲載から7日以内">NEW!</span>)}{product.name}</strong>
              <span className="maker-name">{product.maker}</span>
            </div>
            <div className="spec-info">
              <div className="spec-item"><div className="spec-label">CPU</div><div className="spec-value">{product.cpu || '情報なし'}</div></div>
              <div className="spec-item"><div className="spec-label">GPU</div><div className="spec-value">{product.gpu || '情報なし'}</div></div>
              <div className="spec-item"><div className="spec-label">メモリ</div><div className="spec-value">{product.memory || '情報なし'}</div></div>
              <div className="spec-item"><div className="spec-label">ストレージ</div><div className="spec-value">{product.storage || '情報なし'}</div></div>
            </div>
          </div>
        </div>
        <div className="price-block">
          {product.discountrate > 0 ? (
            <>
              {isMobile ? (
                <div className="sale-price-container">
                  {product.price > product.effectiveprice ? (
                    <>
                      <div className="discount-rate-row">
                        <span className={`discount-rate-badge-sp ${(() => { const rate = product.discountrate; if (rate >= 30) return 'discount-high'; else if (rate >= 10) return 'discount-mid'; else return 'discount-low'; })()}`}>
                          {product.discountrate}%OFF
                        </span>
                      </div>
                      <div className="price-row">
                        <span className="original-price-inline"><span className="list-price-strikethrough">¥{product.price.toLocaleString()}</span></span>
                        <span className="actual-price-inline"><span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <div className="discount-actual-row">
                      <span className={`discount-rate-badge-sp ${(() => { const rate = product.discountrate; if (rate >= 30) return 'discount-high'; else if (rate >= 10) return 'discount-mid'; else return 'discount-low'; })()}`}>{product.discountrate}%OFF</span>
                      <span className="actual-price-inline"><span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="sale-price-container">
                  {product.price > product.effectiveprice ? (
                    <>
                      <div className="original-price-row"><span className="original-price-inline"><span className="tax-included-small">税込</span><span className="list-price-strikethrough">¥{product.price.toLocaleString()}</span></span></div>
                      <div className="discount-actual-row">
                        <span className={`discount-rate-inline ${(() => { const rate = product.discountrate; if (rate >= 30) return 'discount-high'; else if (rate >= 10) return 'discount-mid'; else return 'discount-low'; })()}`}>{product.discountrate}%OFF</span>
                        <span className="actual-price-inline"><span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <div className="discount-actual-row">
                      <span className={`discount-rate-inline ${(() => { const rate = product.discountrate; if (rate >= 30) return 'discount-high'; else if (rate >= 10) return 'discount-mid'; else return 'discount-low'; })()}`}>{product.discountrate}%OFF</span>
                      <span className="actual-price-inline"><span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="normal-price-row"><span className="actual-price"><span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}</span></div>
          )}
          {!isMobile && (
            <div className="badge-row">
              {(() => {
                const campaignTypes = [...new Set(product.campaigns.map(c => c.type))];
                const hasPointCampaign = campaignTypes.includes('ポイント');
                const allowedTypes = ['クーポン', 'セール'];
                const otherCampaigns = campaignTypes.filter(t => t !== 'ポイント' && allowedTypes.includes(t));
                return (
                  <>
                    {hasPointCampaign && (<span className="badge point-badge">ポイントUP</span>)}
                    {otherCampaigns.map((type, index) => {
                      let badgeClass = 'badge';
                      if (type === 'セール') badgeClass += ' sale-badge';
                      else if (type === 'クーポン') badgeClass += ' coupon-badge';
                      return (<span key={index} className={badgeClass}>{type}</span>);
                    })}
                  </>
                );
              })()}
            </div>
          )}
          <div className="shipping-points-container">
            <div className={`shipping-fee-text ${product.shippingFee === 0 ? 'free' : ''}`}>{product.shippingFee === 0 ? '送料 無料' : `送料 ¥${product.shippingFee.toLocaleString()}`}</div>
            <div className="point-reward-text">
              {(() => {
                const pointCampaigns = product.campaigns.filter(c => c.type === 'ポイント');
                const campaignPoints = pointCampaigns.reduce((sum, c) => sum + c.amount, 0);
                const totalPoints = product.regularPoint + campaignPoints;
                return `${totalPoints.toLocaleString()}ポイント還元`;
              })()}
            </div>
          </div>
        </div>
      </div>
    </a>
  );

  return (
    <div className="nextjs-products-scope">
      <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
        <div className="products-container">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-600 font-semibold">⚠️ 注意</div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* フィルターエリア */}
          <div className="filter-controls">
            {/* モバイル折りたたみ（固定で展開） */}
            <div className="filter-form-wrapper">
              <form className="filter-form" onSubmit={(e) => {
                e.preventDefault();
                const allFilters = {
                  ...filterState.applied,
                  maker: filterState.draft.maker,
                  cpu: filterState.draft.cpu,
                  gpu: filterState.draft.gpu,
                  memory: filterState.draft.memory,
                  storage: filterState.draft.storage,
                  showDesktop: filterState.draft.showDesktop,
                  showNotebook: filterState.draft.showNotebook,
                  priceMin: filterState.draft.priceMin,
                  priceMax: filterState.draft.priceMax,
                  onSale: filterState.draft.onSale,
                  searchKeyword: filterState.draft.searchKeyword
                };
                logCustomEvent('search', buildFilterAnalyticsPayload(allFilters, 1));
                const urlParams = buildUrlParams(allFilters, 1);
                const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
                window.location.href = newUrl;
              }}>
                {/* 1行目: フィルターボタン行 */}
                <div className="filter-section">
                  <h3 className="filter-section-title">絞り込み条件</h3>
                  <div className="filter-buttons-row">
                    <FilterButton label="メーカー" selectedCount={filterState.draft.maker.length} onClick={() => setIsMakerModalOpen(true)} />
                    <FilterButton label="CPU" selectedCount={filterState.draft.cpu.length} onClick={() => setIsCpuModalOpen(true)} />
                    <FilterButton label="GPU" selectedCount={filterState.draft.gpu.length} onClick={() => setIsGpuModalOpen(true)} />
                    <FilterButton label="メモリ" selectedCount={filterState.draft.memory.length} onClick={() => setIsMemoryModalOpen(true)} />
                    <FilterButton label="ストレージ" selectedCount={filterState.draft.storage.length} onClick={() => setIsStorageModalOpen(true)} />
                  </div>
                </div>

                {/* 2行目: 価格/検索/PC種類/ボタン */}
                <div className="filter-section">
                  <div className="price-search-pc-type-buttons-row">
                    <div className="price-range-compact pc-only">
                      <div className="price-box-styled">
                        <span className="filter-label">価格</span>
                        <div className="price-selects-styled">
                          {/* 価格は省略（/searchで調整） */}
                        </div>
                      </div>
                    </div>
                    <div className="search-compact pc-only">
                      <div className="search-box-styled">
                        <span className="filter-label">キーワード</span>
                        <input type="text" className="search-input-styled" placeholder="商品名、スペックなど" value={filterState.draft.searchKeyword} onChange={(e) => setFilterState(prev => ({ ...prev, draft: { ...prev.draft, searchKeyword: e.target.value } }))} />
                      </div>
                    </div>
                    <div className="pc-type-checkboxes">
                      <label className="pc-type-checkbox-label">
                        <input type="checkbox" checked={filterState.draft.showDesktop} onChange={(e) => {
                          const newShowDesktop = e.target.checked;
                          const newShowNotebook = filterState.draft.showNotebook;
                          if (!newShowDesktop && !newShowNotebook) return;
                          setFilterState(prev => ({ ...prev, draft: { ...prev.draft, showDesktop: newShowDesktop } }));
                        }} />
                        デスクトップ
                      </label>
                      <label className="pc-type-checkbox-label">
                        <input type="checkbox" checked={filterState.draft.showNotebook} onChange={(e) => {
                          const newShowNotebook = e.target.checked;
                          const newShowDesktop = filterState.draft.showDesktop;
                          if (!newShowDesktop && !newShowNotebook) return;
                          setFilterState(prev => ({ ...prev, draft: { ...prev.draft, showNotebook: newShowNotebook } }));
                        }} />
                        ノートブック
                      </label>
                    </div>
                    <div className="filter-buttons-inline">
                      <button type="button" className="filter-clear" onClick={clearFilters}>クリア</button>
                      <button type="submit" className="filter-submit">検索</button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* フィルターチップ */}
            {hasActiveFilters && (
              <FilterChips
                searchKeyword={filterState.applied.searchKeyword}
                onClearSearch={handleClearSearch}
                selectedMakers={filterState.applied.maker}
                selectedCpus={filterState.applied.cpu}
                selectedGpus={filterState.applied.gpu}
                selectedMemory={filterState.applied.memory}
                selectedStorage={filterState.applied.storage}
                priceMin={filterState.applied.priceMin}
                priceMax={filterState.applied.priceMax}
                onRemoveMaker={handleRemoveMaker}
                onRemoveCpu={handleRemoveCpu}
                onRemoveGpu={handleRemoveGpu}
                onRemoveMemory={handleRemoveMemory}
                onRemoveStorage={handleRemoveStorage}
                onClearPrice={handleClearPrice}
              />
            )}
          </div>

          

          <h1 className="results-title">RTX 4060 (8GB)搭載PC 最安値・安い順</h1>
          <div className="pr-under-title-sp">このページにはPRが含まれます。</div>

          <div className="results-and-sort-header">
            <div className="results-count">
              <span className="text-gray-600">検索結果 <span className="font-semibold text-red-600">{filteredProducts.length.toLocaleString()}</span>件</span>
              <span className="text-gray-400 text-sm ml-2 pr-text-pc">このページにはPRが含まれます。</span>
            </div>
            <div className="results-sort-right">
              <div className="sale-toggle-inline">
                <button type="button" className={`sale-button ${filterState.applied.onSale ? 'active' : ''}`} onClick={() => {
                  const newOnSale = !filterState.applied.onSale;
                  const newFilters = { ...filterState.applied, onSale: newOnSale };
                  setFilterState(prev => ({ ...prev, applied: newFilters }));
                  setCurrentPage(1);
                  const urlParams = buildUrlParams(newFilters, 1);
                  const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
                  window.location.href = newUrl;
                }}>🔥SALE開催中</button>
              </div>
              <div className="sort-selector-inline">
                <select value={filterState.applied.sortBy} onChange={(e) => {
                  const newSort = e.target.value;
                  logCustomEvent('sort', { sort_type: newSort, previous_sort: filterState.applied.sortBy });
                  setFilterState(prev => ({ ...prev, applied: { ...prev.applied, sortBy: newSort } }));
                  setCurrentPage(1);
                  const newFilters = { ...filterState.applied, sortBy: newSort };
                  const urlParams = buildUrlParams(newFilters, 1);
                  const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
                  window.location.href = newUrl;
                }}>
                  <option value="price-asc">価格安い順</option>
                  <option value="price-desc">価格高い順</option>
                  <option value="discount-desc">値下げ率順</option>
                  <option value="name-asc">商品名順</option>
                  <option value="maker-asc">メーカー順</option>
                </select>
              </div>
            </div>
          </div>

          <div className="product-list">
            {currentPageProducts.length > 0 ? (
              currentPageProducts.map((product) => (
                <ProductCardCmp key={product.id} product={product} />
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 text-xl mb-2">該当する商品が見つかりませんでした</div>
                <p className="text-gray-400">フィルター条件を変更してお試しください</p>
                <button onClick={clearFilters} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">フィルターをクリア</button>
              </div>
            )}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={handlePageChange} />

          {/* モーダル群 */}
          <FilterModal isOpen={isMakerModalOpen} onClose={() => setIsMakerModalOpen(false)} title="メーカー" options={makerOptions} selectedValues={filterState.draft.maker} onSelectionChange={(values) => updateDraftFilterValues('maker', values)} onApply={handleModalApply} />
          <HierarchicalFilterModal isOpen={isCpuModalOpen} onClose={() => setIsCpuModalOpen(false)} title="CPU" hierarchyOptions={cpuOptionsHierarchy} selectedValues={filterState.draft.cpu} onSelectionChange={(values) => updateDraftFilterValues('cpu', values)} onApply={handleModalApply} />
          <HierarchicalFilterModal isOpen={isGpuModalOpen} onClose={() => setIsGpuModalOpen(false)} title="GPU" hierarchyOptions={gpuOptionsHierarchy} selectedValues={filterState.draft.gpu} onSelectionChange={(values) => updateDraftFilterValues('gpu', values)} onApply={handleModalApply} />
          <FilterModal isOpen={isMemoryModalOpen} onClose={() => setIsMemoryModalOpen(false)} title="メモリ" options={memoryOptions} selectedValues={filterState.draft.memory} onSelectionChange={(values) => updateDraftFilterValues('memory', values)} onApply={handleModalApply} />
          <FilterModal isOpen={isStorageModalOpen} onClose={() => setIsStorageModalOpen(false)} title="ストレージ" options={storageOptions} selectedValues={filterState.draft.storage} onSelectionChange={(values) => updateDraftFilterValues('storage', values)} onApply={handleModalApply} />
        </div>
      </div>
    </div>
  );
}

export default function ClientPage() {
  return (
    <Suspense fallback={<LoadingSpinner type="data" />}>
      <Rtx4060PageContent />
    </Suspense>
  );
}



