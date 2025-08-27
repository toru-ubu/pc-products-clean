// イヤバズDB ウィジェット用 JavaScript
// WordPressカスタムHTML埋め込み用

// グローバル変数
let makerOptions = [];
let gpuOptionsHierarchy = {};
let selectedMaker = [];
let selectedGpu = [];

// ウィジェット専用のURL生成関数
function buildWidgetUrl(params) {
  const baseUrl = 'https://earbuds-plus.jp/db/';
  const queryString = new URLSearchParams(params).toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// フィルターオプションを取得
async function loadFilterOptions() {
  try {
    const response = await fetch('https://pc-products-clean.vercel.app/config/filter-options.json');
    const data = await response.json();
    
    makerOptions = data.makers || [];
    gpuOptionsHierarchy = data.gpuOptionsHierarchy || {};
    
    // モーダルにオプションを追加
    populateMakerOptions();
    populateGpuOptions();
  } catch (error) {
    console.error('フィルターオプションの読み込みに失敗しました:', error);
  }
}

// メーカーオプションをモーダルに追加
function populateMakerOptions() {
  const container = document.getElementById('maker-options');
  if (!container) return;
  
  container.innerHTML = '';
  
  makerOptions.forEach(option => {
    const label = document.createElement('label');
    label.className = 'filter-option-label';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'filter-option-checkbox';
    checkbox.value = option;
    checkbox.checked = selectedMaker.includes(option);
    checkbox.onchange = (e) => handleMakerSelection(option, e.target.checked);
    
    const text = document.createElement('span');
    text.textContent = option;
    
    label.appendChild(checkbox);
    label.appendChild(text);
    container.appendChild(label);
  });
}

// GPUオプションをモーダルに追加（階層構造対応）
function populateGpuOptions() {
  const container = document.getElementById('gpu-options');
  if (!container) return;
  
  container.innerHTML = '';
  
  Object.entries(gpuOptionsHierarchy).forEach(([series, models]) => {
    // シリーズグループ
    const seriesGroup = document.createElement('div');
    seriesGroup.className = 'filter-series-group';
    
    // シリーズヘッダー
    const seriesHeader = document.createElement('div');
    seriesHeader.className = 'filter-series-header';
    
    const seriesLabel = document.createElement('label');
    seriesLabel.className = 'filter-series-label';
    
    const seriesCheckbox = document.createElement('input');
    seriesCheckbox.type = 'checkbox';
    seriesCheckbox.className = 'filter-option-checkbox';
    seriesCheckbox.onchange = (e) => handleGpuSeriesSelection(series, models, e.target.checked);
    
    const seriesName = document.createElement('span');
    seriesName.className = 'series-name';
    seriesName.textContent = series;
    
    const selectedCount = document.createElement('span');
    selectedCount.className = 'selected-count';
    const selectedModels = models.filter(model => selectedGpu.includes(model));
    selectedCount.textContent = `(${selectedModels.length}/${models.length})`;
    
    seriesLabel.appendChild(seriesCheckbox);
    seriesLabel.appendChild(seriesName);
    seriesLabel.appendChild(selectedCount);
    seriesHeader.appendChild(seriesLabel);
    seriesGroup.appendChild(seriesHeader);
    
    // モデル一覧
    const modelsContainer = document.createElement('div');
    modelsContainer.className = 'filter-models-container';
    
    models.forEach(model => {
      const modelLabel = document.createElement('label');
      modelLabel.className = 'filter-model-label';
      
      const modelCheckbox = document.createElement('input');
      modelCheckbox.type = 'checkbox';
      modelCheckbox.className = 'filter-option-checkbox';
      modelCheckbox.value = model;
      modelCheckbox.checked = selectedGpu.includes(model);
      modelCheckbox.onchange = (e) => handleGpuSelection(model, e.target.checked);
      
      const modelName = document.createElement('span');
      modelName.className = 'model-name';
      modelName.textContent = model;
      
      modelLabel.appendChild(modelCheckbox);
      modelLabel.appendChild(modelName);
      modelsContainer.appendChild(modelLabel);
    });
    
    seriesGroup.appendChild(modelsContainer);
    container.appendChild(seriesGroup);
    
    // シリーズの選択状態を更新
    updateGpuSeriesState(series, models, seriesCheckbox);
  });
}

// GPUシリーズの選択状態を更新
function updateGpuSeriesState(series, models, seriesCheckbox) {
  const selectedModels = models.filter(model => selectedGpu.includes(model));
  const isFullySelected = selectedModels.length === models.length && models.length > 0;
  const isPartiallySelected = selectedModels.length > 0 && !isFullySelected;
  
  seriesCheckbox.checked = isFullySelected;
  seriesCheckbox.indeterminate = isPartiallySelected;
}

// メーカー選択処理
function handleMakerSelection(value, checked) {
  if (checked) {
    if (!selectedMaker.includes(value)) {
      selectedMaker.push(value);
    }
  } else {
    selectedMaker = selectedMaker.filter(item => item !== value);
  }
  updateMakerSelectedText();
}

// GPU選択処理
function handleGpuSelection(value, checked) {
  if (checked) {
    if (!selectedGpu.includes(value)) {
      selectedGpu.push(value);
    }
  } else {
    selectedGpu = selectedGpu.filter(item => item !== value);
  }
  updateGpuSelectedText();
  // GPUモーダルを再描画してシリーズ状態を更新
  populateGpuOptions();
}

// GPUシリーズ選択処理
function handleGpuSeriesSelection(series, models, checked) {
  if (checked) {
    // シリーズ選択: 全モデルを追加
    models.forEach(model => {
      if (!selectedGpu.includes(model)) {
        selectedGpu.push(model);
      }
    });
  } else {
    // シリーズ解除: 全モデルを削除
    const modelsSet = new Set(models);
    selectedGpu = selectedGpu.filter(value => !modelsSet.has(value));
  }
  updateGpuSelectedText();
  populateGpuOptions();
}

// メーカー選択テキスト更新
function updateMakerSelectedText() {
  const element = document.getElementById('maker-selected-text');
  if (element) {
    element.textContent = selectedMaker.length > 0 ? selectedMaker.join(', ') : '選択してください';
  }
}

// GPU選択テキスト更新
function updateGpuSelectedText() {
  const element = document.getElementById('gpu-selected-text');
  if (element) {
    element.textContent = selectedGpu.length > 0 ? selectedGpu.join(', ') : '選択してください';
  }
}

// メーカーモーダルを開く
function openMakerModal() {
  const modal = document.getElementById('maker-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// メーカーモーダルを閉じる
function closeMakerModal() {
  const modal = document.getElementById('maker-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// GPUモーダルを開く
function openGpuModal() {
  const modal = document.getElementById('gpu-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// GPUモーダルを閉じる
function closeGpuModal() {
  const modal = document.getElementById('gpu-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// メーカーフィルター適用
function applyMakerFilter() {
  const params = {};
  if (selectedMaker.length > 0) {
    params.maker = selectedMaker.join(',');
  }
  
  const widgetUrl = buildWidgetUrl(params);
  window.location.href = widgetUrl;
}

// GPUフィルター適用
function applyGpuFilter() {
  const params = {};
  if (selectedGpu.length > 0) {
    params.gpu = selectedGpu.join(',');
  }
  
  const widgetUrl = buildWidgetUrl(params);
  window.location.href = widgetUrl;
}

// キーワード検索実行
function executeKeywordSearch() {
  const input = document.getElementById('keyword-input');
  const keyword = input ? input.value.trim() : '';
  
  if (keyword) {
    const params = { keyword: keyword };
    const widgetUrl = buildWidgetUrl(params);
    window.location.href = widgetUrl;
  }
}

// キーワード検索のEnterキー処理
function handleKeywordKeyPress(event) {
  if (event.key === 'Enter') {
    executeKeywordSearch();
  }
}

// モーダル外クリックで閉じる
document.addEventListener('DOMContentLoaded', function() {
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
});
