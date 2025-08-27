// イヤバズDB ウィジェット用 スタンドアロンJavaScript
// エラーハンドリングを強化した版

// グローバル変数
let makerOptions = [];
let gpuOptions = [];
let selectedMaker = [];
let selectedGpu = [];

// デバッグ用ログ関数
function log(message) {
  console.log('[イヤバズDB ウィジェット]', message);
}

// エラーハンドリング関数
function handleError(error, context) {
  console.error('[イヤバズDB ウィジェット エラー]', context, error);
  
  // ユーザーにエラーを表示（オプション）
  const container = document.getElementById('earbuds-widget-container');
  if (container) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'background: #fee; color: #c33; padding: 10px; border-radius: 4px; margin: 10px 0;';
    errorDiv.textContent = `エラーが発生しました: ${context}`;
    container.appendChild(errorDiv);
  }
}

// ウィジェット専用のURL生成関数
function buildWidgetUrl(params) {
  try {
    const baseUrl = 'https://earbuds-plus.jp/db/';
    const queryString = new URLSearchParams(params).toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  } catch (error) {
    handleError(error, 'URL生成エラー');
    return baseUrl;
  }
}

// フィルターオプションを取得
async function loadFilterOptions() {
  try {
    log('フィルターオプションを読み込み中...');
    
    const response = await fetch('https://pc-products-clean.vercel.app/config/filter-options.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    log('フィルターオプション取得成功:', data);
    
    makerOptions = data.makerOptions || [];
    gpuOptions = data.gpuOptionsHierarchy ? Object.values(data.gpuOptionsHierarchy).flat() : [];
    
    // モーダルにオプションを追加
    populateMakerOptions();
    populateGpuOptions();
    
    log('フィルターオプション設定完了');
  } catch (error) {
    handleError(error, 'フィルターオプション読み込みエラー');
    
    // フォールバック用のデフォルトオプション
    makerOptions = ['ドスパラ', 'マウス', 'フロンティア', 'Lenovo', 'パソコン工房', 'ツクモ', 'サイコム'];
    gpuOptions = ['RTX 4070', 'RTX 4080', 'RTX 4090', 'RTX 4060', 'RTX 4050'];
    
    populateMakerOptions();
    populateGpuOptions();
  }
}

// メーカーオプションをモーダルに追加
function populateMakerOptions() {
  try {
    const container = document.getElementById('maker-options');
    if (!container) {
      log('メーカーオプションコンテナが見つかりません');
      return;
    }
    
    container.innerHTML = '';
    
    makerOptions.forEach(option => {
      const label = document.createElement('label');
      label.className = 'filter-option';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = option;
      checkbox.checked = selectedMaker.includes(option);
      checkbox.onchange = (e) => handleMakerSelection(option, e.target.checked);
      
      const text = document.createElement('span');
      text.className = 'filter-option-text';
      text.textContent = option;
      
      label.appendChild(checkbox);
      label.appendChild(text);
      container.appendChild(label);
    });
    
    log('メーカーオプション設定完了:', makerOptions.length + '個');
  } catch (error) {
    handleError(error, 'メーカーオプション設定エラー');
  }
}

// GPUオプションをモーダルに追加
function populateGpuOptions() {
  try {
    const container = document.getElementById('gpu-options');
    if (!container) {
      log('GPUオプションコンテナが見つかりません');
      return;
    }
    
    container.innerHTML = '';
    
    gpuOptions.forEach(option => {
      const label = document.createElement('label');
      label.className = 'filter-option';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = option;
      checkbox.checked = selectedGpu.includes(option);
      checkbox.onchange = (e) => handleGpuSelection(option, e.target.checked);
      
      const text = document.createElement('span');
      text.className = 'filter-option-text';
      text.textContent = option;
      
      label.appendChild(checkbox);
      label.appendChild(text);
      container.appendChild(label);
    });
    
    log('GPUオプション設定完了:', gpuOptions.length + '個');
  } catch (error) {
    handleError(error, 'GPUオプション設定エラー');
  }
}

// メーカー選択処理
function handleMakerSelection(value, checked) {
  try {
    if (checked) {
      if (!selectedMaker.includes(value)) {
        selectedMaker.push(value);
      }
    } else {
      selectedMaker = selectedMaker.filter(item => item !== value);
    }
    updateMakerSelectedText();
    log('メーカー選択更新:', selectedMaker);
  } catch (error) {
    handleError(error, 'メーカー選択処理エラー');
  }
}

// GPU選択処理
function handleGpuSelection(value, checked) {
  try {
    if (checked) {
      if (!selectedGpu.includes(value)) {
        selectedGpu.push(value);
      }
    } else {
      selectedGpu = selectedGpu.filter(item => item !== value);
    }
    updateGpuSelectedText();
    log('GPU選択更新:', selectedGpu);
  } catch (error) {
    handleError(error, 'GPU選択処理エラー');
  }
}

// メーカー選択テキスト更新
function updateMakerSelectedText() {
  try {
    const element = document.getElementById('maker-selected-text');
    if (element) {
      element.textContent = selectedMaker.length > 0 ? selectedMaker.join(', ') : '選択してください';
    }
  } catch (error) {
    handleError(error, 'メーカー選択テキスト更新エラー');
  }
}

// GPU選択テキスト更新
function updateGpuSelectedText() {
  try {
    const element = document.getElementById('gpu-selected-text');
    if (element) {
      element.textContent = selectedGpu.length > 0 ? selectedGpu.join(', ') : '選択してください';
    }
  } catch (error) {
    handleError(error, 'GPU選択テキスト更新エラー');
  }
}

// メーカーモーダルを開く
function openMakerModal() {
  try {
    const modal = document.getElementById('maker-modal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      log('メーカーモーダルを開きました');
    } else {
      log('メーカーモーダルが見つかりません');
    }
  } catch (error) {
    handleError(error, 'メーカーモーダルを開くエラー');
  }
}

// メーカーモーダルを閉じる
function closeMakerModal() {
  try {
    const modal = document.getElementById('maker-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      log('メーカーモーダルを閉じました');
    }
  } catch (error) {
    handleError(error, 'メーカーモーダルを閉じるエラー');
  }
}

// GPUモーダルを開く
function openGpuModal() {
  try {
    const modal = document.getElementById('gpu-modal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      log('GPUモーダルを開きました');
    } else {
      log('GPUモーダルが見つかりません');
    }
  } catch (error) {
    handleError(error, 'GPUモーダルを開くエラー');
  }
}

// GPUモーダルを閉じる
function closeGpuModal() {
  try {
    const modal = document.getElementById('gpu-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      log('GPUモーダルを閉じました');
    }
  } catch (error) {
    handleError(error, 'GPUモーダルを閉じるエラー');
  }
}

// メーカーフィルター適用
function applyMakerFilter() {
  try {
    const params = {};
    if (selectedMaker.length > 0) {
      params.maker = selectedMaker.join(',');
    }
    
    const widgetUrl = buildWidgetUrl(params);
    log('メーカーフィルター適用:', widgetUrl);
    window.location.href = widgetUrl;
  } catch (error) {
    handleError(error, 'メーカーフィルター適用エラー');
  }
}

// GPUフィルター適用
function applyGpuFilter() {
  try {
    const params = {};
    if (selectedGpu.length > 0) {
      params.gpu = selectedGpu.join(',');
    }
    
    const widgetUrl = buildWidgetUrl(params);
    log('GPUフィルター適用:', widgetUrl);
    window.location.href = widgetUrl;
  } catch (error) {
    handleError(error, 'GPUフィルター適用エラー');
  }
}

// キーワード検索実行
function executeKeywordSearch() {
  try {
    const input = document.getElementById('keyword-input');
    const keyword = input ? input.value.trim() : '';
    
    if (keyword) {
      const params = { keyword: keyword };
      const widgetUrl = buildWidgetUrl(params);
      log('キーワード検索実行:', widgetUrl);
      window.location.href = widgetUrl;
    } else {
      log('キーワードが入力されていません');
    }
  } catch (error) {
    handleError(error, 'キーワード検索実行エラー');
  }
}

// キーワード検索のEnterキー処理
function handleKeywordKeyPress(event) {
  try {
    if (event.key === 'Enter') {
      executeKeywordSearch();
    }
  } catch (error) {
    handleError(error, 'キーワード検索Enterキー処理エラー');
  }
}

// 初期化処理
function initializeWidget() {
  try {
    log('ウィジェット初期化開始');
    
    // フィルターオプションを読み込み
    loadFilterOptions();
    
    // モーダル外クリックで閉じる処理
    const makerModal = document.getElementById('maker-modal');
    const gpuModal = document.getElementById('gpu-modal');
    
    if (makerModal) {
      makerModal.addEventListener('click', function(e) {
        if (e.target === makerModal) {
          closeMakerModal();
        }
      });
    }
    
    if (gpuModal) {
      gpuModal.addEventListener('click', function(e) {
        if (e.target === gpuModal) {
          closeGpuModal();
        }
      });
    }
    
    log('ウィジェット初期化完了');
  } catch (error) {
    handleError(error, 'ウィジェット初期化エラー');
  }
}

// DOM読み込み完了時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWidget);
} else {
  initializeWidget();
}
