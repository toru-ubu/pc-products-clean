'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, logCustomEvent } from '../../lib/firebase';
import { useSavedItems } from '../../context/SavedItemsContext';
import { getMockProducts } from '../../utils/mockData';
import { FilterModal } from '../../components/FilterModal';
import { HierarchicalFilterModal } from '../../components/HierarchicalFilterModal';
import { FilterButton } from '../../components/FilterButton';
import { FilterChips } from '../../components/FilterChips';
import { Pagination } from '../../components/Pagination';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useFilterOptions } from '../../hooks/useFilterOptions';
import { isMatchingAny } from '../../utils/filterNormalization';
import { generateDynamicTitle } from '../../utils/titleGenerator';
import { shouldShowNew } from '../../utils/productUtils';
import ProductCardUnified from '../../components/ProductCardUnified';


function ProductsPageContent() {
  const _router = useRouter();
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
      cpu: [] as string[],
      gpu: [] as string[],
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
    // 一時的なフィルター（モーダル内や検索窓で編集中）
    draft: {
      maker: [] as string[],
      cpu: [] as string[],
      gpu: [] as string[],
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

  // ページビューイベントを送信
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      logCustomEvent('page_view', {
        page_name: 'search',
        page_title: '商品一覧',
        current_filters: filterState.applied
      });
    }
  }, []); // 初回読み込み時のみ実行

  // ページネーション状態
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // モーダル状態
  const [isMakerModalOpen, setIsMakerModalOpen] = useState(false);
  const [isCpuModalOpen, setIsCpuModalOpen] = useState(false);
  const [isGpuModalOpen, setIsGpuModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // モーダルが開いているかどうかを判定
  const isAnyModalOpen = isMakerModalOpen || isCpuModalOpen || isGpuModalOpen || isMemoryModalOpen || isStorageModalOpen;

  // body固定ロック
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // クリーンアップ関数
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAnyModalOpen]);

  // スマホでのフィルター折りたたみは廃止（常時展開）

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
  }, [searchParams]);

  // データ取得（API経由・CDNキャッシュ対象）
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('limit', '5000');

        const res = await fetch(`/db/api/products?${params.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'force-cache'
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        const apiProducts: Product[] = data?.products || [];

        // 正規化: createdAt を Date へ、suppressNew を boolean へ
        const normalizeToDate = (value: any): Date | null => {
          if (!value) return null;
          // Firestore Timestamp
          if (typeof value?.toDate === 'function') {
            const d = value.toDate();
            return isNaN(d.getTime()) ? null : d;
          }
          // REST/JSON {seconds,nanoseconds} or {_seconds,_nanoseconds}
          if (typeof value === 'object') {
            const secs = (value as any).seconds ?? (value as any)._seconds;
            if (typeof secs === 'number') {
              const d = new Date(secs * 1000);
              return isNaN(d.getTime()) ? null : d;
            }
          }
          const d = new Date(value as any);
          return isNaN(d.getTime()) ? null : d;
        };

        const normalized = apiProducts.map(p => ({
          ...p,
          // 型上は Date | null だが、実体は文字列/オブジェクトの可能性があるため正規化
          createdAt: normalizeToDate((p as any).createdAt) as any,
          updatedAt: normalizeToDate((p as any).updatedAt) as any,
          suppressNew: (p as any).suppressNew === true
        }));

        if (normalized.length > 0) {
          console.log('APIから商品データを取得:', normalized.length, '件');
          // DEBUG: NEW表示条件の確認（正規化後）
          try {
            const sample = normalized.slice(0, 10).map(p => {
              const created = p.createdAt as any as Date | null;
              const diffMs = created ? (Date.now() - created.getTime()) : null;
              const diffDays = diffMs !== null ? Math.floor(diffMs / (1000*60*60*24)) : null;
              return {
                id: p.id,
                suppressNew: (p as any).suppressNew,
                createdAt_iso: created ? created.toISOString() : null,
                diffDays,
                shouldShow: shouldShowNew(p as any)
              };
            });
            console.log('NEW debug sample:', sample);
          } catch (e) { console.log('NEW debug error', e); }
          setProducts(normalized as any);
          setFilteredProducts(normalized as any);
        } else {
          console.log('APIからデータが0件。モックデータを使用します。');
          const mockData = getMockProducts();
          setProducts(mockData);
          setFilteredProducts(mockData);
        }

        setLoading(false);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの読み込み中にエラーが発生しました。モックデータを表示します。');

        const mockData = getMockProducts();
        setProducts(mockData);
        setFilteredProducts(mockData);
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // フィルター処理
  const applyFilters = useCallback(() => {
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

    // 形状フィルター（PC/SP共通）- チェックボックス状態を形状フィルターに変換
    const effectiveShapeFilters: string[] = [];
    if (applied.showDesktop) effectiveShapeFilters.push('デスクトップ');
    if (applied.showNotebook) effectiveShapeFilters.push('ノートブック');
    
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
      case 'newest':
        filtered.sort((a, b) => {
          const aIsNew = shouldShowNew(a) ? 1 : 0;
          const bIsNew = shouldShowNew(b) ? 1 : 0;
          if (aIsNew !== bIsNew) return bIsNew - aIsNew;
          const da = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt as any);
          const db = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt as any);
          return (db.getTime() || 0) - (da.getTime() || 0);
        });
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
    
    // 動的タイトル更新
    const dynamicTitle = generateDynamicTitle(filterState);
    document.title = dynamicTitle;
  }, [products, filterState, isMobile]);

  // ページネーション計算
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageProducts = filteredProducts.slice(startIndex, endIndex);

  // フィルタークリア（真のページリロード）
  const clearFilters = () => {
            window.location.href = '/db/search';
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
  }, [applyFilters, products.length]);

  // 初期タイトル設定
  useEffect(() => {
    const dynamicTitle = generateDynamicTitle(filterState);
    document.title = dynamicTitle;
  }, []);

  // URL管理のヘルパー関数
  const buildUrlParams = (currentFilters: typeof filterState.applied, page: number = 1) => {
    const params = new URLSearchParams();
    
    if (currentFilters.searchKeyword.trim()) {
      params.set('keyword', currentFilters.searchKeyword);
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
    
    // 両方選択なしの場合はデスクトップのみに自動調整
    if (!currentFilters.showDesktop && !currentFilters.showNotebook) {
      currentFilters.showDesktop = true;
    }

    const plusItems = [];
    if (currentFilters.showDesktop) plusItems.push('desktop');
    if (currentFilters.showNotebook) plusItems.push('notebook');

    // デフォルト（デスクトップのみ）の場合はパラメータなし
    if (plusItems.length === 1 && plusItems[0] === 'desktop') {
      // パラメータなし
    } else {
      params.set('plus', plusItems.join(','));
    }
    
    if (currentFilters.sortBy !== 'price-asc') {
      params.set('sort', currentFilters.sortBy);
    }
    
    if (page > 1) {
      params.set('page', page.toString());
    }
    
    return params.toString();
  };

  // 分析送信用のフィルター要約ペイロードを生成
  const buildFilterAnalyticsPayload = (currentFilters: typeof filterState.applied, page: number = 1) => {
    const plusItems: string[] = [];
    if (currentFilters.showDesktop) plusItems.push('desktop');
    if (currentFilters.showNotebook) plusItems.push('notebook');

    const priceRange =
      currentFilters.priceMin === 0 && currentFilters.priceMax === 1000000
        ? 'all'
        : `${currentFilters.priceMin}-${currentFilters.priceMax}`;

    // 短い要約文字列（カーディナリティ抑制のため値を圧縮）
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
      // 既存パラメータ（維持）
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

      // 追加する詳細パラメータ（文字列化）
      maker_values: currentFilters.maker.join(',') || '(none)',
      cpu_values: currentFilters.cpu.join(',') || '(none)',
      gpu_values: currentFilters.gpu.join(',') || '(none)',
      memory_values: currentFilters.memory.join(',') || '(none)',
      storage_values: currentFilters.storage.join(',') || '(none)',
      price_range: priceRange,
      plus: plusItems.join(',') || 'desktop',
      sort_type: currentFilters.sortBy,
      page,

      // ユーザーが作成済みのカスタム定義名に合わせる（要約）
      filters_applied: filtersSummary
    } as const;
  };

  const parseUrlParams = (params: URLSearchParams) => {
    const plusParam = params.get('plus');
    return {
      applied: {
        maker: params.get('maker')?.split(',').filter(Boolean) || [],
        cpu: params.get('cpu')?.split(',').filter(Boolean) || [],
        gpu: params.get('gpu')?.split(',').filter(Boolean) || [],
        memory: params.get('memory')?.split(',').filter(Boolean) || [],
        storage: params.get('storage')?.split(',').filter(Boolean) || [],
        showDesktop: !plusParam || plusParam.includes('desktop'),
        showNotebook: plusParam?.includes('notebook') || false,
        priceMin: parseInt(params.get('priceMin') || '0'),
        priceMax: parseInt(params.get('priceMax') || '1000000'),
        onSale: params.get('onSale') === 'true',
        searchKeyword: params.get('keyword') || '',
        sortBy: params.get('sort') || 'price-asc'
      },
      currentPage: parseInt(params.get('page') || '1')
    };
  };

  const _updateUrl = (newFilters: typeof filterState.applied) => {
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };

  // チップ削除ハンドラー（真のページリロード）
  const handleRemoveMaker = (maker: string) => {
    const newFilters = {
      ...filterState.applied,
      maker: filterState.applied.maker.filter(m => m !== maker)
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };



  const handleRemoveCpu = (cpu: string) => {
    const newFilters = {
      ...filterState.applied,
      cpu: filterState.applied.cpu.filter(c => c !== cpu)
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };

  const handleRemoveGpu = (gpu: string) => {
    const newFilters = {
      ...filterState.applied,
      gpu: filterState.applied.gpu.filter(g => g !== gpu)
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };

  const handleRemoveMemory = (memory: string) => {
    const newFilters = {
      ...filterState.applied,
      memory: filterState.applied.memory.filter(m => m !== memory)
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };

  const handleRemoveStorage = (storage: string) => {
    const newFilters = {
      ...filterState.applied,
      storage: filterState.applied.storage.filter(s => s !== storage)
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };

  const handleClearSearch = () => {
    const newFilters = {
      ...filterState.applied,
      searchKeyword: ''
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };

  const handleClearPrice = () => {
    const newFilters = {
      ...filterState.applied,
      priceMin: 0,
      priceMax: 1000000
    };
    const urlParams = buildUrlParams(newFilters);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };



  // モーダル適用ハンドラー（一時フィルターを適用してページリロード）
  const handleModalApply = () => {
    // 一時フィルターを実際のフィルターに反映
    const newFilters = {
      ...filterState.applied,
      maker: filterState.draft.maker,
      cpu: filterState.draft.cpu,
      gpu: filterState.draft.gpu,
      memory: filterState.draft.memory,
      storage: filterState.draft.storage
    };
    
    // 検索イベントを送信（詳細フィルター値付き）
    logCustomEvent('search', buildFilterAnalyticsPayload(newFilters, 1));

    const urlParams = buildUrlParams(newFilters, 1); // 新しい検索時は1ページ目
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    const urlParams = buildUrlParams(filterState.applied, page);
    const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
    window.location.href = newUrl;
  };

  // 商品カードコンポーネント（共通化）
  const ProductCard = ({ product }: { product: Product }) => (
    <ProductCardUnified product={product} currentPage={currentPage} currentSort={filterState.applied.sortBy} />
  );

  if (loading || filterOptionsLoading) {
    return (
      <LoadingSpinner 
        type={loading ? 'data' : 'filter'}
      />
    );
  }

  return (
    <div className="nextjs-products-scope">
      <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
        {/* ページタイトル帯（廃止） */}
        
        <div className="products-container">

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 font-semibold">⚠️ 注意</div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* フィルターエリア */}
        <div className="filter-controls">
          <div className={`filter-form-wrapper`}>
            <form className="filter-form" onSubmit={(e) => { 
              e.preventDefault(); 
              // 一時フィルターも含めて全て適用してページリロード
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
              
              // 検索イベントを送信
              logCustomEvent('search', buildFilterAnalyticsPayload(allFilters, 1));
              
              const urlParams = buildUrlParams(allFilters, 1); // 新しい検索時は1ページ目
              const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
              window.location.href = newUrl;
            }}>
            {/* SP専用: 最上段にキーワード→価格を配置 */}
            <div className="filter-section sp-only">
              <div className="sp-search-price-row">
                {/* キーワード */}
                <div className="search-compact">
                  <div className="search-box-styled">
                    <span className="filter-label">キーワード</span>
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
                {/* 価格 */}
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
              </div>
            </div>

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

                {/* SP専用：PC種類（ストレージの右隣に配置） */}
                <div className="pc-type-inline sp-only">
                  <button
                    type="button"
                    className={`pc-type-pill ${filterState.draft.showDesktop ? 'active' : ''}`}
                    onClick={() => {
                      const next = !filterState.draft.showDesktop;
                      // 両方falseは不可 → もう一方がtrueなら切り替えOK、両方falseになる場合は無視
                      if (!next && !filterState.draft.showNotebook) return;
                      setFilterState(prev => ({
                        ...prev,
                        draft: { ...prev.draft, showDesktop: next }
                      }));
                    }}
                  >
                    デスクトップ
                  </button>
                  <button
                    type="button"
                    className={`pc-type-pill ${filterState.draft.showNotebook ? 'active' : ''}`}
                    onClick={() => {
                      const next = !filterState.draft.showNotebook;
                      if (!next && !filterState.draft.showDesktop) return;
                      setFilterState(prev => ({
                        ...prev,
                        draft: { ...prev.draft, showNotebook: next }
                      }));
                    }}
                  >
                    ノートブック
                  </button>
                </div>
              </div>
            </div>

            {/* 2行目: 価格範囲と検索窓とPC種類とボタン */}
            <div className="filter-section">
              <div className="price-search-pc-type-buttons-row">
                {/* 価格範囲（PCのみ表示、SPでは上のsp-onlyを使用） */}
                <div className="price-range-compact pc-only">
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

                {/* 検索窓（PCのみ表示、SPでは上のsp-onlyを使用） */}
                <div className="search-compact pc-only">
                  <div className="search-box-styled">
                    <span className="filter-label">キーワード</span>
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

                {/* PC種類チェックボックス（PC/SP共通） */}
                <div className="pc-type-checkboxes">
                  <label className="pc-type-checkbox-label">
                    <input
                      type="checkbox"
                      checked={filterState.draft.showDesktop}
                      onChange={(e) => {
                        const newShowDesktop = e.target.checked;
                        const newShowNotebook = filterState.draft.showNotebook;
                        
                        // 両方選択なしを防ぐ
                        if (!newShowDesktop && !newShowNotebook) {
                          return; // 変更を無視
                        }
                        
                        setFilterState(prev => ({
                          ...prev,
                          draft: {
                            ...prev.draft,
                            showDesktop: newShowDesktop
                          }
                        }));
                      }}
                    />
                    デスクトップ
                  </label>
                  <label className="pc-type-checkbox-label">
                    <input
                      type="checkbox"
                      checked={filterState.draft.showNotebook}
                      onChange={(e) => {
                        const newShowNotebook = e.target.checked;
                        const newShowDesktop = filterState.draft.showDesktop;
                        
                        // 両方選択なしを防ぐ
                        if (!newShowDesktop && !newShowNotebook) {
                          return; // 変更を無視
                        }
                        
                        setFilterState(prev => ({
                          ...prev,
                          draft: {
                            ...prev.draft,
                            showNotebook: newShowNotebook
                          }
                        }));
                      }}
                    />
                    ノートブック
                  </label>
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
              searchKeyword={filterState.applied.searchKeyword}
              onClearSearch={handleClearSearch}
              selectedMakers={filterState.applied.maker}

              selectedCpus={(() => {
                // シリーズが完全包含されている場合はシリーズ名で集約
                const covered = new Set<string>();
                const result: string[] = [];
                Object.entries(cpuOptionsHierarchy).forEach(([series, models]) => {
                  if (models.length > 0 && models.every(m => filterState.applied.cpu.includes(m))) {
                    result.push(series);
                    models.forEach(m => covered.add(m));
                  }
                });
                filterState.applied.cpu.forEach(v => { if (!covered.has(v)) result.push(v); });
                return result;
              })()}
              selectedGpus={(() => {
                const covered = new Set<string>();
                const result: string[] = [];
                Object.entries(gpuOptionsHierarchy).forEach(([series, models]) => {
                  if (models.length > 0 && models.every(m => filterState.applied.gpu.includes(m))) {
                    result.push(series);
                    models.forEach(m => covered.add(m));
                  }
                });
                filterState.applied.gpu.forEach(v => { if (!covered.has(v)) result.push(v); });
                return result;
              })()}
              selectedMemory={filterState.applied.memory}
              selectedStorage={filterState.applied.storage}
              priceMin={filterState.applied.priceMin}
              priceMax={filterState.applied.priceMax}
              onRemoveMaker={handleRemoveMaker}
              onRemoveCpu={(cpu) => {
                // シリーズ名が来た場合は配下の全モデルを削除
                if (cpuOptionsHierarchy[cpu]) {
                  const modelsSet = new Set(cpuOptionsHierarchy[cpu]);
                  const newFilters = {
                    ...filterState.applied,
                    cpu: filterState.applied.cpu.filter(c => !modelsSet.has(c))
                  };
                  const urlParams = buildUrlParams(newFilters);
                  const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
                  window.location.href = newUrl;
                } else {
                  handleRemoveCpu(cpu);
                }
              }}
              onRemoveGpu={(gpu) => {
                if (gpuOptionsHierarchy[gpu]) {
                  const modelsSet = new Set(gpuOptionsHierarchy[gpu]);
                  const newFilters = {
                    ...filterState.applied,
                    gpu: filterState.applied.gpu.filter(g => !modelsSet.has(g))
                  };
                  const urlParams = buildUrlParams(newFilters);
                  const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
                  window.location.href = newUrl;
                } else {
                  handleRemoveGpu(gpu);
                }
              }}
              onRemoveMemory={handleRemoveMemory}
              onRemoveStorage={handleRemoveStorage}
              onClearPrice={handleClearPrice}
            />
          )}
          
          {/* SP表示専用PR文言 */}
          <div className="pr-notice-sp">
            <span className="text-gray-400 text-xs">
              このページにはPRが含まれます
            </span>
          </div>
        </div>

        {/* 結果タイトル（フィルター直下・件数行の直前） */}
        <h1 className="results-title">
          {generateDynamicTitle(filterState)}
        </h1>

        {/* SP限定：タイトル直下のPR表記 */}
        <div className="pr-under-title-sp">このページにはPRが含まれます。</div>

        {/* 検索結果とソート・SALEボタンの配置 */}
        <div className="results-and-sort-header">
          {/* 左端の検索結果表示 */}
          <div className="results-count">
            <span className="text-gray-600">
              検索結果 <span className="font-semibold text-red-600">{filteredProducts.length.toLocaleString()}</span>件
            </span>
            <span className="text-gray-400 text-sm ml-2 pr-text-pc">
              このページにはPRが含まれます。
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
                  const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
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
                
                // ソートイベントを送信
                logCustomEvent('sort', {
                  sort_type: newSort,
                  previous_sort: filterState.applied.sortBy
                });
                
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
                const newUrl = urlParams ? `/db/search?${urlParams}` : '/db/search';
                window.location.href = newUrl;
              }}>
                <option value="price-asc">価格安い順</option>
                <option value="price-desc">価格高い順</option>
                <option value="discount-desc">値下げ率順</option>
                <option value="name-asc">商品名順</option>
                <option value="maker-asc">メーカー順</option>
                <option value="newest">新着順</option>
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
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingSpinner type="data" />}>
      <ProductsPageContent />
    </Suspense>
  );
}
