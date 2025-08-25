import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  type?: 'data' | 'filter';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message, 
  type = 'data' 
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getMessage = () => {
    if (message) return message;
    return type === 'data' ? 'データを読み込み中...' : 'フィルター設定を読み込み中...';
  };

  return (
    <div className="nextjs-products-scope">
      <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
        <div className="products-container">
          <div className="text-center">
            {/* PC表示用：大きなスピナー */}
            {!isMobile && (
              <div className="loading-spinner-large">
                <div className="spinner-circle"></div>
                <div className="spinner-text">
                  <div className="text-xl font-semibold text-gray-700 mb-4">
                    {getMessage()}
                  </div>
                  <div className="text-gray-500">しばらくお待ちください</div>
                </div>
              </div>
            )}
            
            {/* SP表示用：小さなスピナー */}
            {isMobile && (
              <div className="loading-spinner-mobile">
                <div className="spinner-circle-small"></div>
                <div className="spinner-text-mobile">
                  <div className="text-lg font-semibold text-gray-700 mb-2">
                    {getMessage()}
                  </div>
                  <div className="text-sm text-gray-500">しばらくお待ちください</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
