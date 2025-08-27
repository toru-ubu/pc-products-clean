import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types/product';
import { getMockProducts } from '../utils/mockData';

// キャッシュ設定
const CACHE_DURATION = 5 * 60 * 1000; // 5分
const cache = new Map<string, { data: Product[], timestamp: number }>();

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  // キャッシュからデータを取得
  const getCachedProducts = useCallback((cacheKey: string) => {
    const now = Date.now();
    const cached = cache.get(cacheKey);
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('キャッシュからデータを取得:', cacheKey);
      return cached.data;
    }
    
    return null;
  }, []);

  // データをキャッシュに保存
  const setCachedProducts = useCallback((cacheKey: string, data: Product[]) => {
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    console.log('データをキャッシュに保存:', cacheKey);
  }, []);

  const _retryWithBackoff = async (operation: () => Promise<void>, attempt: number = 1) => {
    try {
      await operation();
    } catch (err) {
      console.error(`操作失敗 (試行 ${attempt}/${maxRetries}):`, err);
      
      if (attempt <= maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`リトライ ${attempt} 回目を ${delay}ms 後に実行`);
        setRetryCount(attempt);
        
        // 指数バックオフでリトライ
        setTimeout(() => _retryWithBackoff(operation, attempt + 1), delay);
      } else {
        console.error('最大リトライ回数に達しました。モックデータを使用します。');
        setError('データの取得に失敗しました。仮のデータを表示しています。');
        const mockData = getMockProducts();
        setAllProducts(mockData);
        setProducts(mockData);
        setLoading(false);
      }
    }
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // キャッシュをチェック
      const cacheKey = 'products';
      const cachedData = getCachedProducts(cacheKey);
      
      if (cachedData) {
        setAllProducts(cachedData);
        setProducts(cachedData);
        setLoading(false);
        return;
      }
      
      // Firebase接続が無効化されているため、モックデータを使用
      const mockProducts = getMockProducts();
      
      // データをキャッシュに保存
      setCachedProducts(cacheKey, mockProducts);
      
      setAllProducts(mockProducts);
      setProducts(mockProducts);
      setLoading(false);
      
    } catch (err) {
      console.error('Error loading products:', err);
      setError('データの読み込み中にエラーが発生しました。');
      setLoading(false);
    }
  }, [setCachedProducts]);

  const retryLoadProducts = () => {
    setRetryCount(0);
    setError(null);
    // キャッシュをクリアして再取得
    cache.clear();
    loadProducts();
  };

  const updateProducts = useCallback((newProducts: Product[]) => {
    setProducts(newProducts);
  }, []);

  // キャッシュをクリアする関数
  const clearCache = useCallback(() => {
    cache.clear();
    console.log('キャッシュをクリアしました');
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    allProducts,
    loading,
    error,
    retryCount,
    retryLoadProducts,
    updateProducts,
    clearCache // 新しい関数を追加
  };
};
