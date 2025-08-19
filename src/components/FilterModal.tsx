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
    <div className="modal-overlay" onClick={onClose}>
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
            適用
          </button>
        </div>
      </div>
    </div>
  );
};
