interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  // 表示するページ番号の範囲を計算
  const getPageNumbers = () => {
    const delta = 2; // 現在のページの前後に表示するページ数
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination-container">
      {/* 表示中の件数情報 */}
      <div className="pagination-info">
        {totalItems > 0 ? (
          <span>
            {startItem.toLocaleString()}〜{endItem.toLocaleString()}件を表示 
            (全{totalItems.toLocaleString()}件中)
          </span>
        ) : (
          <span>0件</span>
        )}
      </div>

      {/* ページネーションナビゲーション */}
      <div className="pagination-nav">
        {/* 前のページボタン */}
        <button
          className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← 前へ
        </button>

        {/* 最初のページ */}
        {pageNumbers[0] > 1 && (
          <>
            <button
              className="pagination-btn"
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {pageNumbers[0] > 2 && <span className="pagination-ellipsis">...</span>}
          </>
        )}

        {/* ページ番号 */}
        {pageNumbers.map(page => (
          <button
            key={page}
            className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {/* 最後のページ */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && 
              <span className="pagination-ellipsis">...</span>
            }
            <button
              className="pagination-btn"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* 次のページボタン */}
        <button
          className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          次へ →
        </button>
      </div>
    </div>
  );
};
