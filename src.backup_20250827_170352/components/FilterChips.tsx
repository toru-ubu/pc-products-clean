'use client';

import React from 'react';

interface FilterChipsProps {
  // 検索キーワード
  searchKeyword: string;
  onClearSearch: () => void;
  
  // 選択中のフィルター
  selectedMakers: string[];
  selectedCpus: string[];
  selectedGpus: string[];
  selectedMemory: string[];
  selectedStorage: string[];
  priceMin: number;
  priceMax: number;
  
  // 削除ハンドラー
  onRemoveMaker: (maker: string) => void;
  onRemoveCpu: (cpu: string) => void;
  onRemoveGpu: (gpu: string) => void;
  onRemoveMemory: (memory: string) => void;
  onRemoveStorage: (storage: string) => void;
  onClearPrice: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  searchKeyword,
  onClearSearch,
  selectedMakers,
  selectedCpus,
  selectedGpus,
  selectedMemory,
  selectedStorage,
  priceMin,
  priceMax,
  onRemoveMaker,
  onRemoveCpu,
  onRemoveGpu,
  onRemoveMemory,
  onRemoveStorage,
  onClearPrice
}) => {
  // チップが存在するかチェック
  const hasAnyChips = searchKeyword.trim() || 
    selectedMakers.length > 0 ||
    selectedCpus.length > 0 ||
    selectedGpus.length > 0 ||
    selectedMemory.length > 0 ||
    selectedStorage.length > 0 ||
    (priceMin > 0 || priceMax < 1000000);

  // 価格範囲の表示テキスト
  const getPriceText = () => {
    if (priceMin > 0 && priceMax < 1000000) {
      return `💰 ${(priceMin / 10000).toLocaleString()}万円 〜 ${(priceMax / 10000).toLocaleString()}万円`;
    } else if (priceMin > 0) {
      return `💰 ${(priceMin / 10000).toLocaleString()}万円以上`;
    } else if (priceMax < 1000000) {
      return `💰 ${(priceMax / 10000).toLocaleString()}万円以下`;
    }
    return '';
  };



  if (!hasAnyChips) return null;

  return (
    <div className="filter-chips-container">
      <div className="filter-chips-wrapper">
        {/* 検索キーワードチップ */}
        {searchKeyword.trim() && (
          <div className="filter-chip search-chip">
            <span className="chip-icon">🔍</span>
            <span className="chip-text">{searchKeyword}</span>
            <button 
              className="chip-remove"
              onClick={onClearSearch}
              aria-label="検索キーワードを削除"
            >
              ×
            </button>
          </div>
        )}

        {/* メーカーチップ */}
        {selectedMakers.map(maker => (
          <div key={maker} className="filter-chip maker-chip">
            <span className="chip-text">{maker}</span>
            <button 
              className="chip-remove"
              onClick={() => onRemoveMaker(maker)}
              aria-label={`${maker}を削除`}
            >
              ×
            </button>
          </div>
        ))}



        {/* CPUチップ */}
        {selectedCpus.map(cpu => (
          <div key={cpu} className="filter-chip cpu-chip">
            <span className="chip-text">{cpu}</span>
            <button 
              className="chip-remove"
              onClick={() => onRemoveCpu(cpu)}
              aria-label={`${cpu}を削除`}
            >
              ×
            </button>
          </div>
        ))}

        {/* GPUチップ */}
        {selectedGpus.map(gpu => (
          <div key={gpu} className="filter-chip gpu-chip">
            <span className="chip-text">{gpu}</span>
            <button 
              className="chip-remove"
              onClick={() => onRemoveGpu(gpu)}
              aria-label={`${gpu}を削除`}
            >
              ×
            </button>
          </div>
        ))}

        {/* メモリチップ */}
        {selectedMemory.map(memory => (
          <div key={memory} className="filter-chip memory-chip">
            <span className="chip-text">{memory}</span>
            <button 
              className="chip-remove"
              onClick={() => onRemoveMemory(memory)}
              aria-label={`${memory}を削除`}
            >
              ×
            </button>
          </div>
        ))}

        {/* ストレージチップ */}
        {selectedStorage.map(storage => (
          <div key={storage} className="filter-chip storage-chip">
            <span className="chip-text">{storage}</span>
            <button 
              className="chip-remove"
              onClick={() => onRemoveStorage(storage)}
              aria-label={`${storage}を削除`}
            >
              ×
            </button>
          </div>
        ))}



        {/* 価格範囲チップ */}
        {(priceMin > 0 || priceMax < 1000000) && (
          <div className="filter-chip price-chip">
            <span className="chip-text">{getPriceText()}</span>
            <button 
              className="chip-remove"
              onClick={onClearPrice}
              aria-label="価格範囲を削除"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
