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

  // 統合されたフィルター状態
  const [filterState, setFilterState] = useState({
    // 適用済みフィルター（実際に商品フィルタリングに使用）
    applied: {
      maker: [] as string[],
      shape: [] as string[],
      cpu: [] as string[],
      gpu: [] as string[],
      memory: [] as string[],
      storage: [] as string[],
      showDesktop: true,
      showNotebook: true,
      priceMin: 0,
      priceMax: 1000000,
      onSale: false,
      searchKeyword: '',
      sortBy: 'price-asc'
    },
    // 一時的なフィルター（モーダル内や検索窓で編集中）
    draft: {
      maker: [] as string[],
      shape: [] as string[],
      cpu: [] as string[],
      gpu: [] as string[],
      memory: [] as string[],
      storage: [] as string[],
      showDesktop: true,
      showNotebook: true,
      priceMin: 0,
      priceMax: 1000000,
      onSale: false,
      searchKeyword: ''
    }
  });

  // ページネーション状態
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // モーダル状態
  const [isMakerModalOpen, setIsMakerModalOpen] = useState(false);
  const [isShapeModalOpen, setIsShapeModalOpen] = useState(false);
  const [isCpuModalOpen, setIsCpuModalOpen] = useState(false);
  const [isGpuModalOpen, setIsGpuModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // スマホでのフィルター折りたたみ状態
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  // ウィンドウサイズを検知（PC表示かSP表示かを判定）
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // フィルターオプション（静的ファイルから取得）
  const { makerOptions, cpuOptionsHierarchy, gpuOptionsHierarchy, memoryOptions, storageOptions, isLoading: filterOptionsLoading } = useFilterOptions();

  // 形状オプション
  const shapeOptions = ['デスクトップ', 'ノートブック'];

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
    
    setFilterState({
      applied: urlState.applied,
      draft: {
        maker: urlState.applied.maker,
        shape: urlState.applied.shape,
        cpu: urlState.applied.cpu,
        gpu: urlState.applied.gpu,
        memory: urlState.applied.memory,
        storage: urlState.applied.storage,
        showDesktop: urlState.applied.showDesktop,
        showNotebook: urlState.applied.showNotebook,
        priceMin: urlState.applied.priceMin,
        priceMax: urlState.applied.priceMax,
        onSale: urlState.applied.onSale,
        searchKeyword: urlState.applied.searchKeyword
      }
    });
    setCurrentPage(urlState.currentPage);

    // スマホでフィルターが適用されている場合は折りたたむ
    const hasActiveFilters = Boolean(
      urlState.applied.searchKeyword || 
      urlState.applied.maker.length > 0 ||
      urlState.applied.shape.length > 0 ||
      urlState.applied.cpu.length > 0 ||
      urlState.applied.gpu.length > 0 ||
      urlState.applied.memory.length > 0 ||
      urlState.applied.storage.length > 0 ||
      urlState.applied.priceMin > 0 ||
      urlState.applied.priceMax < 1000000 ||
      urlState.applied.onSale ||
      !urlState.applied.showDesktop ||
      !urlState.applied.showNotebook
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
    const { applied } = filterState;
    
    console.log('=== Filter Debug Start ===');
    console.log('Total products:', products.length);
    console.log('Current filters:', applied);
    console.log('isMobile:', isMobile);

    // メーカーフィルター
    if (applied.maker.length > 0) {
      filtered = filtered.filter(product => 
        applied.maker.includes(product.maker)
      );
    }

    // 形状フィルター（PC/SP共通）- PC表示の場合はチェックボックス状態を形状フィルターに変換
    let effectiveShapeFilters = [...applied.shape];
    
    // PC表示の場合、チェックボックス状態を形状フィルターに変換
    if (!isMobile) {
      effectiveShapeFilters = [];
      if (applied.showDesktop) effectiveShapeFilters.push('デスクトップ');
      if (applied.showNotebook) effectiveShapeFilters.push('ノートブック');
    }
    
    if (effectiveShapeFilters.length > 0) {
      console.log('Shape filter debug:', 'effectiveShapeFilters:', effectiveShapeFilters, 'products before:', filtered.length);
      filtered = filtered.filter(product => {
        // 複数の条件で判定
        const matches = effectiveShapeFilters.some(shapeFilter => {
          if (shapeFilter === 'デスクトップ') {
            const typeMatch = product.type === 'デスクトップ';
            const categoryMatch = product.category === 'desktop';
            const result = typeMatch || categoryMatch;
            console.log(`Desktop check for ${product.name}: type=${product.type}(${typeMatch}) category=${product.category}(${categoryMatch}) result=${result}`);
            return result;
          } else if (shapeFilter === 'ノートブック') {
            const typeMatch = product.type === 'ノートブック';
            const categoryMatch = product.category === 'notebook';
            const result = typeMatch || categoryMatch;
            console.log(`Notebook check for ${product.name}: type=${product.type}(${typeMatch}) category=${product.category}(${categoryMatch}) result=${result}`);
            return result;
          }
          return false;
        });
        
        if (!matches) {
          console.log('Shape filter exclude:', product.name, 'type:', product.type, 'category:', product.category);
        }
        return matches;
      });
      console.log('Shape filter debug:', 'products after:', filtered.length);
    }

    // CPUフィルター（正規化ベース）
    if (applied.cpu.length > 0) {
      filtered = filtered.filter(product => 
        isMatchingAny(applied.cpu, product.cpu)
      );
    }

    // GPUフィルター（正規化ベース）
    if (applied.gpu.length > 0) {
      filtered = filtered.filter(product => 
        isMatchingAny(applied.gpu, product.gpu)
      );
    }

    // メモリフィルター
    if (applied.memory.length > 0) {
      filtered = filtered.filter(product => 
        applied.memory.some(memory => product.memory.includes(memory))
      );
    }

    // ストレージフィルター
    if (applied.storage.length > 0) {
      filtered = filtered.filter(product => 
        applied.storage.some(storage => product.storage.includes(storage))
      );
    }

    // 価格フィルター
    filtered = filtered.filter(product => 
      product.effectiveprice >= applied.priceMin && 
      product.effectiveprice <= applied.priceMax
    );

    // セール中フィルター
    if (applied.onSale) {
      filtered = filtered.filter(product => 
        product.discountrate > 0
      );
    }

    // PC種類フィルターは形状フィルターに統合されたため削除

    // キーワード検索（複数キーワード対応 + 全角半角正規化）
    if (applied.searchKeyword.trim()) {
      // 全角半角正規化関数
      const normalizeText = (text: string) => {
        return text
          .toLowerCase()
          .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
          .replace(/\s+/g, ' ')
          .trim();
      };

      // 複数キーワードをスペースで分割
      const keywords = normalizeText(applied.searchKeyword)
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

    console.log('=== Filter Debug End ===');
    console.log('Final filtered products:', filtered.length);
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

  // 一時フィルター更新のヘルパー関数（適用ボタンまでは実際のappliedを変更しない）
  const updateDraftFilterValues = (type: keyof typeof filterState.draft, values: string[]) => {
    setFilterState(prev => ({
      ...prev,
      draft: {
        ...prev.draft,
        [type]: values
      }
    }));
  };

  // フィルター適用（商品データ変更時、またはフィルター条件変更時）
  useEffect(() => {
    if (products.length > 0) {
      applyFilters();
    }
  }, [products, filterState.applied]);

  // URL管理のヘルパー関数
  const buildUrlParams = (currentFilters: typeof filterState.applied, page: number = 1) => {
    const params = new URLSearchParams();
    
    if (currentFilters.searchKeyword.trim()) {
      params.set('search', currentFilters.searchKeyword);
    }
    
    if (currentFilters.maker.length > 0) {
      params.set('maker', currentFilters.maker.join(','));
    }
    
    if (currentFilters.shape.length > 0) {
      params.set('shape', currentFilters.shape.join(','));
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
    
    if (!currentFilters.showDesktop) {
      params.set('hideDesktop', 'true');
    }
    
    if (!currentFilters.showNotebook) {
      params.set('hideNotebook', 'true');
    }
    
    if (currentFilters.sortBy !== 'price-asc') {
      params.set('sort', currentFilters.sortBy);
    }
    
    if (page > 1) {
      params.set('page', page.toString());
    }
    
    return params.toString();
  };

  const parseUrlParams = (params: URLSearchParams) => {
    return {
      applied: {
        maker: params.get('maker')?.split(',').filter(Boolean) || [],
        shape: params.get('shape')?.split(',').filter(Boolean) || [],
        cpu: params.get('cpu')?.split(',').filter(Boolean) || [],
        gpu: params.get('gpu')?.split(',').filter(Boolean) || [],
        memory: params.get('memory')?.split(',').filter(Boolean) || [],
        storage: params.get('storage')?.split(',').filter(Boolean) || [],
        showDesktop: params.get('hideDesktop') !== 'true',
        showNotebook: params.get('hideNotebook') !== 'true',
        priceMin: parseInt(params.get('priceMin') || '0'),
        priceMax: parseInt(params.get('priceMax') || '1000000'),
        onSale: params.get('onSale') === 'true',
        searchKeyword: params.get('search') || '',
        sortBy: params.get('sort') || 'price-asc'
      },
      currentPage: parseInt(params.get('page') || '1')
    };
  };

  const updateUrl = (newFilters: typeof filterState.applied) => {
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  // チップ削除ハンドラー（真のページリロード）
  const handleRemoveMaker = (maker: string) => {
    const newFilters = {
      ...filterState.applied,
      maker: filterState.applied.maker.filter(m => m !== maker)
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleRemoveShape = (shape: string) => {
    const newFilters = {
      ...filterState.applied,
      shape: filterState.applied.shape.filter(s => s !== shape)
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleRemoveCpu = (cpu: string) => {
    const newFilters = {
      ...filterState.applied,
      cpu: filterState.applied.cpu.filter(c => c !== cpu)
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleRemoveGpu = (gpu: string) => {
    const newFilters = {
      ...filterState.applied,
      gpu: filterState.applied.gpu.filter(g => g !== gpu)
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleRemoveMemory = (memory: string) => {
    const newFilters = {
      ...filterState.applied,
      memory: filterState.applied.memory.filter(m => m !== memory)
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleRemoveStorage = (storage: string) => {
    const newFilters = {
      ...filterState.applied,
      storage: filterState.applied.storage.filter(s => s !== storage)
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleClearSearch = () => {
    const newFilters = {
      ...filterState.applied,
      searchKeyword: ''
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleClearPrice = () => {
    const newFilters = {
      ...filterState.applied,
      priceMin: 0,
      priceMax: 1000000
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  const handleClearPCType = () => {
    const newFilters = {
      ...filterState.applied,
      showDesktop: true,
      showNotebook: true
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  // モーダル適用ハンドラー（一時フィルターを適用してページリロード）
  const handleModalApply = () => {
    // 一時フィルターを実際のフィルターに反映
    const newFilters = {
      ...filterState.applied,
      maker: filterState.draft.maker,
      shape: filterState.draft.shape,
      cpu: filterState.draft.cpu,
      gpu: filterState.draft.gpu,
      memory: filterState.draft.memory,
      storage: filterState.draft.storage
    };
    
    const urlParams = buildUrlParams(newFilters, 1); // 新しい検索時は1ページ目
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    const urlParams = buildUrlParams(filterState.applied, page);
    const newUrl = urlParams ? `/products?${urlParams}` : '/products';
    window.location.href = newUrl;
  };

  // 商品カードコンポーネント
  const ProductCard = ({ product }: { product: Product }) => (
    <a href={product.productUrl} target="_blank" rel="nofollow sponsored" className="product-card">
      <div className="card-content">
        {/* SP表示用：商品名・メーカーヘッダー */}
        <div className="card-header">
          <strong>{product.name}</strong>
          <span className="maker-name">{product.maker}</span>
        </div>

        {/* 画像+情報ブロック */}
        <div className="card-body">
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
              {/* PC表示用：商品名・メーカー（SP表示では非表示にする） */}
              <div className="pc-only-header">
                <strong>{product.name}</strong>
                <span className="maker-name">{product.maker}</span>
              </div>
              
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
          </div>
        </div>
        
        {/* 価格ブロック */}
        <div className="price-block">
              {/* セールの場合：PC表示は2行、SP表示は1行 */}
              {product.discountrate > 0 ? (
                <>
                  {/* PC/SP表示の条件分岐 */}
                  {isMobile ? (
                    /* SP表示用: 割引率を上に、定価とセール価格を下に横並び */
                    <div className="sale-price-container">
                      {product.price > product.effectiveprice && (
                        <>
                          {/* SP表示用: 1行目 - 割引率のみ */}
                          <div className="discount-rate-row">
                            <span className="discount-rate-inline">
                              {(() => {
                                const rate = product.discountrate;
                                if (rate >= 30) {
                                  return `🚨${rate}%OFF`;
                                } else if (rate >= 10) {
                                  return `🔥${rate}%OFF`;
                                } else if (rate >= 5) {
                                  return `💰${rate}%OFF`;
                                } else {
                                  return `🎉${rate}%OFF`;
                                }
                              })()}
                            </span>
                          </div>
                          
                          {/* SP表示用: 2行目 - 定価 + セール価格を横並び */}
                          <div className="price-row">
                            <span className="original-price-inline">
                              <span className="list-price-strikethrough">¥{product.price.toLocaleString()}</span>
                            </span>
                            
                            <span className="actual-price-inline">
                              <span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {/* SP表示用: 定価が表示されない場合のフォールバック */}
                      {product.price <= product.effectiveprice && (
                        <div className="discount-actual-row">
                          <span className="discount-rate-inline">
                            {(() => {
                              const rate = product.discountrate;
                              if (rate >= 30) {
                                return `🚨${rate}%OFF`;
                              } else if (rate >= 10) {
                                return `🔥${rate}%OFF`;
                              } else if (rate >= 5) {
                                return `💰${rate}%OFF`;
                              } else {
                                return `🎉${rate}%OFF`;
                              }
                            })()}
                          </span>
                          
                          <span className="actual-price-inline">
                            <span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* PC表示用: 2行レイアウト */
                    <div className="sale-price-container">
                      {product.price > product.effectiveprice && (
                        <>
                          {/* PC表示用: 1行目 - 定価のみ */}
                          <div className="original-price-row">
                            <span className="original-price-inline">
                              <span className="tax-included-small">税込</span><span className="list-price-strikethrough">¥{product.price.toLocaleString()}</span>
                            </span>
                          </div>
                          
                          {/* PC表示用: 2行目 - 割引率 + セール価格 */}
                          <div className="discount-actual-row">
                            <span className="discount-rate-inline">
                              {(() => {
                                const rate = product.discountrate;
                                if (rate >= 30) {
                                  return `🚨${rate}%OFF`;
                                } else if (rate >= 10) {
                                  return `🔥${rate}%OFF`;
                                } else if (rate >= 5) {
                                  return `💰${rate}%OFF`;
                                } else {
                                  return `🎉${rate}%OFF`;
                                }
                              })()}
                            </span>
                            
                            <span className="actual-price-inline">
                              <span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {/* PC表示用: 定価が表示されない場合のフォールバック */}
                      {product.price <= product.effectiveprice && (
                        <div className="discount-actual-row">
                          <span className="discount-rate-inline">
                            {(() => {
                              const rate = product.discountrate;
                              if (rate >= 30) {
                                return `🚨${rate}%OFF`;
                              } else if (rate >= 10) {
                                return `🔥${rate}%OFF`;
                              } else if (rate >= 5) {
                                return `💰${rate}%OFF`;
                              } else {
                                return `🎉${rate}%OFF`;
                              }
                            })()}
                          </span>
                          
                          <span className="actual-price-inline">
                            <span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* 通常価格の場合：現在価格のみ */
                <div className="normal-price-row">
                  <span className="actual-price">
                    <span className="tax-included-small">税込</span>¥{product.effectiveprice.toLocaleString()}
                  </span>
                </div>
              )}
              
              {/* 3行目: バッジ（PC表示のみ） */}
              {!isMobile && (
                <div className="badge-row">
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
                        {otherCampaigns.map((type, index) => {
                          let badgeClass = "badge";
                          if (type === "セール") {
                            badgeClass += " sale-badge";
                          } else if (type === "クーポン") {
                            badgeClass += " coupon-badge";
                          }
                          return (
                            <span key={index} className={badgeClass}>
                              {type}
                            </span>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              )}
              
              {/* 4-5行目: 送料とポイント還元情報 */}
              <div className="shipping-points-container">
                <div className={`shipping-fee-text ${product.shippingFee === 0 ? 'free' : ''}`}>
                  {product.shippingFee === 0 
                    ? '送料 無料' 
                    : `送料 ¥${product.shippingFee.toLocaleString()}`
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">イヤバズDB</h1>

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
              ▼
            </button>
          </div>

          <div className={`filter-form-wrapper ${isFilterCollapsed ? 'collapsed' : ''}`}>
            <form className="filter-form" onSubmit={(e) => { 
              e.preventDefault(); 
              // 一時フィルターも含めて全て適用してページリロード
              const allFilters = {
                ...filterState.applied,
                maker: filterState.draft.maker,
                shape: filterState.draft.shape,
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
              const urlParams = buildUrlParams(allFilters, 1); // 新しい検索時は1ページ目
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
                  selectedCount={filterState.draft.maker.length}
                  onClick={() => setIsMakerModalOpen(true)}
                />

                {/* 形状ボタン */}
                <FilterButton
                  label="形状"
                  selectedCount={filterState.draft.shape.length}
                  onClick={() => setIsShapeModalOpen(true)}
                />

                {/* CPUボタン */}
                <FilterButton
                  label="CPU"
                  selectedCount={filterState.draft.cpu.length}
                  onClick={() => setIsCpuModalOpen(true)}
                />

                {/* GPUボタン */}
                <FilterButton
                  label="GPU"
                  selectedCount={filterState.draft.gpu.length}
                  onClick={() => setIsGpuModalOpen(true)}
                />

                {/* メモリボタン */}
                <FilterButton
                  label="メモリ"
                  selectedCount={filterState.draft.memory.length}
                  onClick={() => setIsMemoryModalOpen(true)}
                />

                {/* ストレージボタン */}
                <FilterButton
                  label="ストレージ"
                  selectedCount={filterState.draft.storage.length}
                  onClick={() => setIsStorageModalOpen(true)}
                />
              </div>
            </div>

            {/* 2行目: 価格範囲と検索窓とPC種類とボタン */}
            <div className="filter-section">
              <div className="price-search-pc-type-buttons-row">
                {/* 価格範囲 */}
                <div className="price-range-compact">
                  <div className="price-box-styled">
                    <span className="filter-label">価格</span>
                    <div className="price-selects-styled">
                      <select 
                        className="price-select-styled"
                        value={filterState.draft.priceMin || ''}
                        onChange={(e) => setFilterState(prev => ({
                          ...prev,
                          draft: {
                            ...prev.draft,
                            priceMin: e.target.value ? parseInt(e.target.value) : 0
                          }
                        }))}
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
                        value={filterState.draft.priceMax === 1000000 ? '' : filterState.draft.priceMax}
                        onChange={(e) => setFilterState(prev => ({
                          ...prev,
                          draft: {
                            ...prev.draft,
                            priceMax: e.target.value ? parseInt(e.target.value) : 1000000
                          }
                        }))}
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
                      value={filterState.draft.searchKeyword}
                      onChange={(e) => setFilterState(prev => ({
                        ...prev,
                        draft: {
                          ...prev.draft,
                          searchKeyword: e.target.value
                        }
                      }))}
                    />
                  </div>
                </div>

                {/* PC種類チェックボックス（PC表示のみ） */}
                {!isMobile && (
                  <div className="pc-type-checkboxes">
                    <label className="pc-type-checkbox-label">
                      <input
                        type="checkbox"
                        checked={filterState.draft.showDesktop}
                        onChange={(e) => setFilterState(prev => ({
                          ...prev,
                          draft: {
                            ...prev.draft,
                            showDesktop: e.target.checked
                          }
                        }))}
                      />
                      デスクトップ
                    </label>
                    <label className="pc-type-checkbox-label">
                      <input
                        type="checkbox"
                        checked={filterState.draft.showNotebook}
                        onChange={(e) => setFilterState(prev => ({
                          ...prev,
                          draft: {
                            ...prev.draft,
                            showNotebook: e.target.checked
                          }
                        }))}
                      />
                      ノートブック
                    </label>
                  </div>
                )}

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
              searchKeyword={filterState.applied.searchKeyword}
              onClearSearch={handleClearSearch}
              selectedMakers={filterState.applied.maker}
              selectedShapes={filterState.applied.shape}
              selectedCpus={filterState.applied.cpu}
              selectedGpus={filterState.applied.gpu}
              selectedMemory={filterState.applied.memory}
              selectedStorage={filterState.applied.storage}
              showDesktop={filterState.applied.showDesktop}
              showNotebook={filterState.applied.showNotebook}
              priceMin={filterState.applied.priceMin}
              priceMax={filterState.applied.priceMax}
              onRemoveMaker={handleRemoveMaker}
              onRemoveShape={handleRemoveShape}
              onRemoveCpu={handleRemoveCpu}
              onRemoveGpu={handleRemoveGpu}
              onRemoveMemory={handleRemoveMemory}
              onRemoveStorage={handleRemoveStorage}
              onClearPCType={handleClearPCType}
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
                {filterState.applied.searchKeyword && (
                  <span className="ml-2 text-sm text-gray-500">
                    （「{filterState.applied.searchKeyword}」で検索）
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
                className={`sale-button ${filterState.applied.onSale ? 'active' : ''}`}
                onClick={() => {
                  const newOnSale = !filterState.applied.onSale;
                  const newFilters = { ...filterState.applied, onSale: newOnSale };
                  setFilterState(prev => ({
                    ...prev,
                    applied: newFilters
                  }));
                  setCurrentPage(1); // ページを1ページ目にリセット
                  
                  // URLも更新（1ページ目で）
                  const urlParams = buildUrlParams(newFilters, 1);
                  const newUrl = urlParams ? `/products?${urlParams}` : '/products';
                  window.location.href = newUrl;
                }}
              >
                🔥SALE開催中
              </button>
            </div>
            
            {/* ソートセレクター */}
            <div className="sort-selector-inline">
              <select value={filterState.applied.sortBy} onChange={(e) => {
                const newSort = e.target.value;
                setFilterState(prev => ({
                  ...prev,
                  applied: {
                    ...prev.applied,
                    sortBy: newSort
                  }
                }));
                setCurrentPage(1); // ページを1ページ目にリセット
                
                // URLも更新（1ページ目で）
                const newFilters = { ...filterState.applied, sortBy: newSort };
                const urlParams = buildUrlParams(newFilters, 1);
                const newUrl = urlParams ? `/products?${urlParams}` : '/products';
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
          selectedValues={filterState.draft.maker}
          onSelectionChange={(values) => updateDraftFilterValues('maker', values)}
          onApply={handleModalApply}
        />

        <FilterModal
          isOpen={isShapeModalOpen}
          onClose={() => setIsShapeModalOpen(false)}
          title="形状"
          options={shapeOptions}
          selectedValues={filterState.draft.shape}
          onSelectionChange={(values) => updateDraftFilterValues('shape', values)}
          onApply={handleModalApply}
        />

        <HierarchicalFilterModal
          isOpen={isCpuModalOpen}
          onClose={() => setIsCpuModalOpen(false)}
          title="CPU"
          hierarchyOptions={cpuOptionsHierarchy}
          selectedValues={filterState.draft.cpu}
          onSelectionChange={(values) => updateDraftFilterValues('cpu', values)}
          onApply={handleModalApply}
        />

        <HierarchicalFilterModal
          isOpen={isGpuModalOpen}
          onClose={() => setIsGpuModalOpen(false)}
          title="GPU"
          hierarchyOptions={gpuOptionsHierarchy}
          selectedValues={filterState.draft.gpu}
          onSelectionChange={(values) => updateDraftFilterValues('gpu', values)}
          onApply={handleModalApply}
        />

        <FilterModal
          isOpen={isMemoryModalOpen}
          onClose={() => setIsMemoryModalOpen(false)}
          title="メモリ"
          options={memoryOptions}
          selectedValues={filterState.draft.memory}
          onSelectionChange={(values) => updateDraftFilterValues('memory', values)}
          onApply={handleModalApply}
        />

        <FilterModal
          isOpen={isStorageModalOpen}
          onClose={() => setIsStorageModalOpen(false)}
          title="ストレージ"
          options={storageOptions}
          selectedValues={filterState.draft.storage}
          onSelectionChange={(values) => updateDraftFilterValues('storage', values)}
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
