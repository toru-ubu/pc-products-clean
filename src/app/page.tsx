'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FilterModal } from '../components/FilterModal';
import { HierarchicalFilterModal } from '../components/HierarchicalFilterModal';
import { useFilterOptions } from '../hooks/useFilterOptions';

export default function Home() {
  const router = useRouter();
  const { makerOptions, gpuOptionsHierarchy } = useFilterOptions();

  // モーダル状態
  const [isMakerModalOpen, setIsMakerModalOpen] = useState(false);
  const [isGpuModalOpen, setIsGpuModalOpen] = useState(false);

  // 選択された値
  const [selectedMaker, setSelectedMaker] = useState<string[]>([]);
  const [selectedGpu, setSelectedGpu] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');

  // 検索実行
  const executeSearch = (type: string, values: string[]) => {
    const params = new URLSearchParams();
    
    if (type === 'maker' && values.length > 0) {
      params.set('maker', values.join(','));
    } else if (type === 'gpu' && values.length > 0) {
      params.set('gpu', values.join(','));
    } else if (type === 'keyword' && keyword.trim()) {
      params.set('keyword', keyword.trim());
    }

    if (params.toString()) {
      router.push(`/search?${params.toString()}`);
    } else {
      router.push('/search');
    }
  };

  // モーダル適用処理
  const handleModalApply = (type: string) => {
    let values: string[] = [];
    
    switch (type) {
      case 'maker':
        values = selectedMaker;
        break;
      case 'gpu':
        values = selectedGpu;
        break;
    }

    executeSearch(type, values);
  };

  // キーワード検索実行
  const handleKeywordSearch = () => {
    if (keyword.trim()) {
      // search側と同じパラメータ名を使用
      const params = new URLSearchParams();
      params.set('keyword', keyword.trim());
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen gaming-background root-page">
      {/* メイン検索エリア */}
      <div className="max-w-2xl mx-auto px-4 pt-16 pb-16 relative z-10">
        {/* タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white leading-tight relative z-10">
            メーカー横断で探せる日本最大のゲーミングPC検索データベース
          </h1>
        </div>

        {/* 上段：メーカー、GPU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* メーカーから探す */}
          <button
            onClick={() => setIsMakerModalOpen(true)}
            className="search-button-horizontal bg-red-500 hover:bg-red-600 text-white"
          >
            <div className="font-semibold">メーカーから探す</div>
          </button>

          {/* GPUから探す */}
          <button
            onClick={() => setIsGpuModalOpen(true)}
            className="search-button-horizontal bg-blue-500 hover:bg-blue-600 text-white"
          >
            <div className="font-semibold">GPUから探す</div>
          </button>
        </div>

        {/* 中段：キーワード検索 */}
        <div className="search-container mb-8">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="メーカー・スペック・キーワード"
            className="search-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleKeywordSearch();
              }
            }}
          />
          <button 
            onClick={handleKeywordSearch}
            className="search-button-red"
          >
            検索
          </button>
        </div>

        {/* 下段：価格帯から探す */}
        <div className="text-center mb-4">
          <h3 className="text-sm md:text-base font-semibold text-white mb-4">価格帯から探す</h3>
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            <Link 
              href="/search?priceMax=100000"
              className="price-range-button-square bg-white border border-blue-500 text-blue-500 hover:bg-blue-50 flex items-center justify-center"
            >
              <div className="font-semibold text-xs md:text-sm">10万円以下</div>
            </Link>
            <Link 
              href="/search?priceMin=100000&priceMax=200000"
              className="price-range-button-square bg-white border border-blue-500 text-blue-500 hover:bg-blue-50 flex items-center justify-center"
            >
              <div className="font-semibold text-xs md:text-sm">10万円〜20万円</div>
            </Link>
            <Link 
              href="/search?priceMin=200000&priceMax=300000"
              className="price-range-button-square bg-white border border-blue-500 text-blue-500 hover:bg-blue-50 flex items-center justify-center"
            >
              <div className="font-semibold text-xs md:text-sm">20万円〜30万円</div>
            </Link>
            <Link 
              href="/search?priceMin=300000"
              className="price-range-button-square bg-white border border-blue-500 text-blue-500 hover:bg-blue-50 flex items-center justify-center"
            >
              <div className="font-semibold text-xs md:text-sm">30万円以上</div>
            </Link>
          </div>
        </div>
      </div>

      {/* モーダル群 */}
      <FilterModal
        isOpen={isMakerModalOpen}
        onClose={() => setIsMakerModalOpen(false)}
        title="メーカー"
        options={makerOptions}
        selectedValues={selectedMaker}
        onSelectionChange={setSelectedMaker}
        onApply={() => handleModalApply('maker')}
      />

      <HierarchicalFilterModal
        isOpen={isGpuModalOpen}
        onClose={() => setIsGpuModalOpen(false)}
        title="GPU"
        hierarchyOptions={gpuOptionsHierarchy}
        selectedValues={selectedGpu}
        onSelectionChange={setSelectedGpu}
        onApply={() => handleModalApply('gpu')}
      />
    </div>
  );
}