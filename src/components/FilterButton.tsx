interface FilterButtonProps {
  label: string;
  selectedCount: number;
  onClick: () => void;
}

export const FilterButton = ({ label, selectedCount, onClick }: FilterButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="filter-button"
    >
      <span className="filter-button-text">
        {label}
        {selectedCount > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
            {selectedCount}
          </span>
        )}
      </span>
      <span className="filter-button-arrow">▼</span>
    </button>
  );
};
