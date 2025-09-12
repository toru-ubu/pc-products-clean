import React, { useState, useEffect, useMemo } from 'react';

interface HierarchicalFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  hierarchyOptions: Record<string, string[]>;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  onApply: () => void;
}

export const HierarchicalFilterModal = ({
  isOpen,
  onClose,
  title,
  hierarchyOptions,
  selectedValues,
  onSelectionChange,
  onApply
}: HierarchicalFilterModalProps) => {

  // モーダルが開いている時にbodyのスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      // body固定を強化
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      // 旧実装では特別なタッチ制御なし
    } else {
      // モーダルが閉じられた時の復元処理
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    // クリーンアップ関数
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  // 全シリーズを最初から展開状態にする
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(
    new Set(Object.keys(hierarchyOptions))
  );

  // GPUモーダル時のみ: 表示ラベルから (NGB) を分岐がない場合に限り隠す
  // 内部値は従来どおりフル文字列（RAM付き）を使用してマッチング精度を維持する
  const gpuDisplayLabels = useMemo(() => {
    if (title !== 'GPU') return null;

    const labelsBySeries: Record<string, Record<string, string>> = {};

    Object.entries(hierarchyOptions).forEach(([series, models]) => {
      // ベース名ごとにVRAM容量の分岐数を集計
      const baseToInfo: Record<string, { vramSet: Set<string> }> = {};

      models.forEach((model) => {
        const baseForGrouping = model.replace(/\s*\(\d+GB\)/g, '').trim();
        const vramMatch = model.match(/\((\d+GB)\)/);
        const vram = vramMatch ? vramMatch[1] : '';

        if (!baseToInfo[baseForGrouping]) {
          baseToInfo[baseForGrouping] = { vramSet: new Set<string>() };
        }
        if (vram) baseToInfo[baseForGrouping].vramSet.add(vram);
      });

      const labelMap: Record<string, string> = {};

      models.forEach((model) => {
        const baseForGrouping = model.replace(/\s*\(\d+GB\)/g, '').trim();
        const hasMultipleVram = (baseToInfo[baseForGrouping]?.vramSet.size || 0) > 1;
        // 分岐している場合はRAMを表示に残し、分岐がない場合は表示からのみRAMを除去
        labelMap[model] = hasMultipleVram ? model : model.replace(/\s*\(\d+GB\)/g, '').trim();
      });

      labelsBySeries[series] = labelMap;
    });

    return labelsBySeries;
  }, [hierarchyOptions, title]);

  const _toggleSeries = (series: string) => {
    const newExpanded = new Set(expandedSeries);
    if (newExpanded.has(series)) {
      newExpanded.delete(series);
    } else {
      newExpanded.add(series);
    }
    setExpandedSeries(newExpanded);
  };

  if (!isOpen) return null;

  const handleSeriesToggle = (series: string, checked: boolean) => {
    const models = hierarchyOptions[series] || [];
    if (checked) {
      // シリーズ選択: 全モデルを追加
      const newValues = [...selectedValues];
      models.forEach(model => {
        if (!newValues.includes(model)) {
          newValues.push(model);
        }
      });
      onSelectionChange(newValues);
    } else {
      // シリーズ解除: 全モデルを削除
      const modelsSet = new Set(models);
      const newValues = selectedValues.filter(value => !modelsSet.has(value));
      onSelectionChange(newValues);
    }
  };

  const handleModelToggle = (model: string, checked: boolean) => {
    if (checked) {
      if (!selectedValues.includes(model)) {
        onSelectionChange([...selectedValues, model]);
      }
    } else {
      onSelectionChange(selectedValues.filter(value => value !== model));
    }
  };

  const isSeriesFullySelected = (series: string) => {
    const models = hierarchyOptions[series] || [];
    return models.length > 0 && models.every(model => selectedValues.includes(model));
  };

  const isSeriesPartiallySelected = (series: string) => {
    const models = hierarchyOptions[series] || [];
    return models.some(model => selectedValues.includes(model)) && !isSeriesFullySelected(series);
  };

  const handleApplyAndClose = () => {
    onApply();
    onClose();
  };

  // 旧実装ではスワイプ閉じるなし

  return (
    <div 
      id="modal-overlay"
      className="modal-overlay" 
      onClick={onClose}
      onTouchMove={(e) => e.preventDefault()}
    >
      <div className="modal-content hierarchical-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-body">
          <h2 className="modal-header">{title}を選択</h2>
          <div className="hierarchical-filter-container">
            {Object.entries(hierarchyOptions).map(([series, models]) => (
              <div key={series} className="filter-series-group">
                {/* シリーズヘッダー */}
                <div className="filter-series-header">
                  <label className="filter-series-label">
                    <input
                      type="checkbox"
                      className="filter-option-checkbox"
                      checked={isSeriesFullySelected(series)}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = isSeriesPartiallySelected(series);
                        }
                      }}
                      onChange={(e) => handleSeriesToggle(series, e.target.checked)}
                    />
                    <span className="series-name">{series}</span>
                    <span className="selected-count">
                      ({models.filter(model => selectedValues.includes(model)).length}/{models.length})
                    </span>
                  </label>
                </div>
                
                {/* モデル一覧 - 常に表示 */}
                <div className="filter-models-container">
                  {models.map((model) => (
                    <label key={model} className="filter-model-label">
                      <input
                        type="checkbox"
                        className="filter-option-checkbox"
                        checked={selectedValues.includes(model)}
                        onChange={(e) => handleModelToggle(model, e.target.checked)}
                      />
                      <span className="model-name">{title === 'GPU' && gpuDisplayLabels ? (gpuDisplayLabels[series]?.[model] || model) : model}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="modal-button-group">
          <button 
            className="btn-primary" 
            onClick={handleApplyAndClose}
          >
            適用して検索
          </button>
        </div>
      </div>
    </div>
  );
};
