import { useState, useEffect } from 'react';

export interface FilterOptions {
  makers: string[];
  cpuOptions?: string[];  // 後方互換性のため残す
  gpuOptions?: string[];  // 後方互換性のため残す
  cpuOptionsHierarchy: Record<string, string[]>;
  gpuOptionsHierarchy: Record<string, string[]>;
  memoryOptions: string[];
  storageOptions: string[];
}

let filterOptionsCache: FilterOptions | null = null;

export const getFilterOptions = async (): Promise<FilterOptions> => {
  if (filterOptionsCache) {
    return filterOptionsCache;
  }

  try {
    const response = await fetch('/config/filter-options.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch filter options: ${response.status}`);
    }
    
    const options = await response.json();
    filterOptionsCache = options;
    return options;
    
  } catch (error) {
    console.error('Error loading filter options:', error);
    
    // フォールバック: デフォルト値を返す
    const fallbackOptions: FilterOptions = {
      makers: ['ドスパラ', 'パソコン工房', 'ツクモ', 'サイコム', 'レノボ', 'フロンティア', 'マウスコンピューター'],
      cpuOptionsHierarchy: {
        'Core Ultra': ['Core Ultra 7 155H', 'Core Ultra 5 135H'],
        'Core i 14th Gen': ['Core i9-14900K', 'Core i7-14700K'],
        'Ryzen 7000シリーズ': ['Ryzen 9 7950X', 'Ryzen 7 7700X']
      },
      gpuOptionsHierarchy: {
        'RTX 40シリーズ': ['RTX 4090 (24GB)', 'RTX 4080 (16GB)', 'RTX 4070 (12GB)'],
        'RTX 30シリーズ': ['RTX 3080 (10GB)', 'RTX 3070 (8GB)', 'RTX 3060 (8GB)']
      },
      memoryOptions: ['8GB', '16GB', '32GB', '64GB'],
      storageOptions: ['256GB', '512GB', '1TB', '2TB']
    };
    
    filterOptionsCache = fallbackOptions;
    return fallbackOptions;
  }
};

// フィルター選択肢を管理するカスタムフック
export const useFilterOptions = () => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoading(true);
        const options = await getFilterOptions();
        setFilterOptions(options);
        setError(null);
      } catch (err) {
        console.error('Failed to load filter options:', err);
        setError('フィルター選択肢の読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, []);

  return {
    filterOptions,
    isLoading,
    error,
    // 便利なヘルパー（既存のコードとの互換性のため）
    makerOptions: filterOptions?.makers || [],
    cpuOptionsHierarchy: filterOptions?.cpuOptionsHierarchy || {},
    gpuOptionsHierarchy: filterOptions?.gpuOptionsHierarchy || {},
    memoryOptions: filterOptions?.memoryOptions || [],
    storageOptions: filterOptions?.storageOptions || []
  };
};
