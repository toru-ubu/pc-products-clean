'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FilterModal } from '../components/FilterModal';
import { HierarchicalFilterModal } from '../components/HierarchicalFilterModal';
import { useFilterOptions } from '../hooks/useFilterOptions';

export default function Home() {
  const router = useRouter();
  const { makerOptions, cpuOptionsHierarchy, gpuOptionsHierarchy } = useFilterOptions();

  // モーダル状態
  const [isMakerModalOpen, setIsMakerModalOpen] = useState(false);
  const [isCpuModalOpen, setIsCpuModalOpen] = useState(false);
  const [isGpuModalOpen, setIsGpuModalOpen] = useState(false);

  // 選択された値
  const [selectedMaker, setSelectedMaker] = useState<string[]>([]);
  const [selectedCpu, setSelectedCpu] = useState<string[]>([]);
  const [selectedGpu, setSelectedGpu] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');

  // 検索実行
  const executeSearch = (type: string, values: string[]) => {
    const params = new URLSearchParams();
    
    if (type === 'maker' && values.length > 0) {
      params.set('maker', values.join(','));
    } else if (type === 'cpu' && values.length > 0) {
      params.set('cpu', values.join(','));
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
      case 'cpu':
        values = selectedCpu;
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
      executeSearch('keyword', [keyword.trim()]);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <div className="text-center pt-16 pb-12">
        <div className="mb-8">
          {/* ロゴアイコン */}
          <div className="w-24 h-24 mx-auto mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* サーバーラック風のアイコン */}
              <rect x="10" y="10" width="80" height="80" fill="none" stroke="#2563eb" strokeWidth="3"/>
              <line x1="10" y1="30" x2="90" y2="30" stroke="#2563eb" strokeWidth="2"/>
              <line x1="10" y1="50" x2="90" y2="50" stroke="#2563eb" strokeWidth="2"/>
              <line x1="10" y1="70" x2="90" y2="70" stroke="#2563eb" strokeWidth="2"/>
              <line x1="30" y1="10" x2="30" y2="90" stroke="#2563eb" strokeWidth="2"/>
              <line x1="70" y1="10" x2="70" y2="90" stroke="#2563eb" strokeWidth="2"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2">イヤバズDB</h1>
          <p className="text-lg text-gray-600">ゲーミングPCが探せるデータベース</p>
        </div>
      </div>

      {/* メイン検索エリア */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        {/* 上段：メーカー、CPU、GPU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* メーカーから探す */}
          <button
            onClick={() => setIsMakerModalOpen(true)}
            className="search-button-horizontal bg-red-500 hover:bg-red-600 text-white"
          >
            <div className="font-semibold">メーカーから探す</div>
          </button>

          {/* CPUから探す */}
          <button
            onClick={() => setIsCpuModalOpen(true)}
            className="search-button-horizontal bg-blue-500 hover:bg-blue-600 text-white"
          >
            <div className="font-semibold">CPUから探す</div>
          </button>

          {/* GPUから探す */}
          <button
            onClick={() => setIsGpuModalOpen(true)}
            className="search-button-horizontal bg-blue-500 hover:bg-blue-600 text-white"
          >
            <div className="font-semibold">GPUから探す</div>
          </button>
        </div>

        {/* 下段：キーワード検索 */}
        <div className="max-w-2xl mx-auto">
          <div className="search-container">
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
        isOpen={isCpuModalOpen}
        onClose={() => setIsCpuModalOpen(false)}
        title="CPU"
        hierarchyOptions={cpuOptionsHierarchy}
        selectedValues={selectedCpu}
        onSelectionChange={setSelectedCpu}
        onApply={() => handleModalApply('cpu')}
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