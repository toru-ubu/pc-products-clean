import React, { useState, useEffect } from 'react';

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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // クリーンアップ関数
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // 全シリーズを最初から展開状態にする
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(
    new Set(Object.keys(hierarchyOptions))
  );

  const toggleSeries = (series: string) => {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content hierarchical-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
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
                    <span className="model-name">{model}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
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
