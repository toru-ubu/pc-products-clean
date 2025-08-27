import React, { useEffect } from 'react';

// ウィジェット専用フィルターモーダル
// 既存のFilterModalをベースに、URL生成のみ調整

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  onApply: () => void;
  filterType: 'maker' | 'gpu' | 'keyword';
}

export const WidgetFilterModal = ({
  isOpen,
  onClose,
  title,
  options,
  selectedValues,
  onSelectionChange,
  onApply,
  filterType
}: FilterModalProps) => {
  // ウィジェット専用のURL生成関数
  const buildWidgetUrl = (params: Record<string, string>) => {
    const baseUrl = 'https://earbuds-plus.jp/db/';
    const queryString = new URLSearchParams(params).toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  // モーダルが開いている時にbodyのスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      // body固定を強化
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      // モーダル内のスクロール要素を制御
      const modalContent = document.querySelector('.modal-content');
      if (modalContent) {
        const handleTouchMove = (e: Event) => {
          // タッチスクロールイベントをキャッチ
          const target = e.target as HTMLElement;
          
          // スクロール可能な要素かどうかを判定
          const scrollable = target.closest('.filter-options-grid');
          
          if (!scrollable) {
            // スクロール可能な要素以外ではスクロールを防止
            e.preventDefault();
          }
          // スクロール可能な要素内ではスクロールを許可（何もしない）
        };
        
        modalContent.addEventListener('touchmove', handleTouchMove, { passive: false });
        
        // クリーンアップ関数でイベントリスナーを削除
        return () => {
          modalContent.removeEventListener('touchmove', handleTouchMove);
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
        };
      }
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

  if (!isOpen) return null;

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      if (!selectedValues.includes(value)) {
        onSelectionChange([...selectedValues, value]);
      }
    } else {
      onSelectionChange(selectedValues.filter(item => item !== value));
    }
  };

  const handleApplyAndClose = () => {
    // ウィジェット専用のURL生成
    const params: Record<string, string> = {};
    
    if (filterType === 'maker' && selectedValues.length > 0) {
      params.maker = selectedValues.join(',');
    } else if (filterType === 'gpu' && selectedValues.length > 0) {
      params.gpu = selectedValues.join(',');
    }
    
    const widgetUrl = buildWidgetUrl(params);
    window.location.href = widgetUrl;
    
    onClose();
  };

  return (
    <div 
      id="modal-overlay"
      className="modal-overlay" 
      onClick={onClose}
      onTouchMove={(e) => e.preventDefault()}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2 className="modal-header">{title}を選択</h2>
        
        <div className="filter-options-grid">
          {options.map((option) => (
            <label key={option} className="filter-option">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={(e) => handleCheckboxChange(option, e.target.checked)}
              />
              <span className="filter-option-text">{option}</span>
            </label>
          ))}
        </div>
        
        <div className="modal-actions">
          <button className="modal-apply-btn" onClick={handleApplyAndClose}>
            適用
          </button>
        </div>
      </div>
    </div>
  );
};
