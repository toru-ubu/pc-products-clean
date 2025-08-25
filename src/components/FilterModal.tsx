import React, { useEffect } from 'react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  onApply: () => void;
}

export const FilterModal = ({
  isOpen,
  onClose,
  title,
  options,
  selectedValues,
  onSelectionChange,
  onApply
}: FilterModalProps) => {
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
    onApply();
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
            <label key={option} className="filter-option-label">
              <input
                type="checkbox"
                className="filter-option-checkbox"
                checked={selectedValues.includes(option)}
                onChange={(e) => handleCheckboxChange(option, e.target.checked)}
              />
              {option}
            </label>
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
