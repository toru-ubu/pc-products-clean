/**
 * フィルター用の正規化関数
 * 
 * 選択肢とFirebaseデータの表記揺れを吸収して
 * より精度の高いマッチングを実現する
 */

/**
 * フィルタリング用のテキスト正規化
 * @param text 正規化対象のテキスト
 * @returns 正規化されたテキスト
 */
export function normalizeForMatching(text: string): string {
  if (!text) return '';
  
  let normalized = text.trim();
  
  // 1. 全角半角統一
  normalized = normalized.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => 
    String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  );
  
  // 2. スペース正規化
  normalized = normalized.replace(/\s+/g, ' ');
  
  // 3. GPU正規化
  normalized = normalizeGpuForMatching(normalized);
  
  // 4. CPU正規化  
  normalized = normalizeCpuForMatching(normalized);
  
  // 5. 内蔵GPU正規化
  normalized = normalizeIntegratedGpuForMatching(normalized);
  
  return normalized.trim();
}

/**
 * GPU用の正規化
 */
function normalizeGpuForMatching(text: string): string {
  let normalized = text;
  
  // Ti表記の統一 (スペースあり)
  normalized = normalized.replace(/RTX\s*(\d+)Ti\b/g, 'RTX $1 Ti');
  normalized = normalized.replace(/RX\s*(\d+)Ti\b/g, 'RX $1 Ti');
  
  // SUPER表記の統一 (大文字・スペースあり)
  normalized = normalized.replace(/\bsuper\b/gi, 'SUPER');
  normalized = normalized.replace(/RTX\s*(\d+)\s*SUPER/g, 'RTX $1 SUPER');
  
  // 容量表記の統一 (括弧あり)
  normalized = normalized.replace(/(\w+)\s+(\d+GB)(?!\))/g, '$1 ($2)');
  
  // Laptop表記の統一
  normalized = normalized.replace(/\s+Laptop\s+(\d+GB)/g, ' Laptop ($1)');
  
  // Intel Arc表記の統一（CPUの除去処理後なので"Intel"を再追加）
  normalized = normalized.replace(/\bArc\s+([AB]\d+)/g, 'Intel Arc $1');
  normalized = normalized.replace(/\bIntel\s+Arc\s+([AB]\d+)/g, 'Intel Arc $1');
  
  return normalized;
}

/**
 * CPU用の正規化
 */
function normalizeCpuForMatching(text: string): string {
  let normalized = text;
  
  // Core表記の統一
  normalized = normalized.replace(/\bIntel\s+/gi, '');
  normalized = normalized.replace(/\bProcessor\s*$/gi, '');
  
  // Core Ultra表記の統一
  normalized = normalized.replace(/Core\s+Ultra\s+(\d+)\s+(\d+\w*)/g, 'Core Ultra $1 $2');
  
  // Core i表記の統一
  normalized = normalized.replace(/Core\s+i(\d+)-(\d+\w*)/g, 'Core i$1-$2');
  
  // Ryzen表記の統一
  normalized = normalized.replace(/\bAMD\s+/gi, '');
  normalized = normalized.replace(/Ryzen\s+(\d+)\s+(\d+\w*)/g, 'Ryzen $1 $2');
  
  return normalized;
}

/**
 * 内蔵GPU用の正規化
 */
function normalizeIntegratedGpuForMatching(text: string): string {
  let normalized = text;
  
  // UHD Graphics表記の統一
  if (normalized === 'UHD') {
    return 'UHD Graphics';
  }
  
  // Iris表記の統一
  if (normalized === 'Iris Xe') {
    return 'Iris Xe Graphics';
  }
  
  // Radeon表記の統一
  normalized = normalized.replace(/^(\d+M)$/, 'Radeon $1');
  
  return normalized;
}

/**
 * 改善されたマッチング関数
 * @param filterValue フィルター選択肢の値
 * @param productValue 商品データの値
 * @returns マッチするかどうか
 */
export function isMatchingValue(filterValue: string, productValue: string): boolean {
  if (!filterValue || !productValue) return false;
  
  const normalizedFilter = normalizeForMatching(filterValue);
  const normalizedProduct = normalizeForMatching(productValue);
  
  // 双方向の部分一致をチェック
  return normalizedProduct.includes(normalizedFilter) || 
         normalizedFilter.includes(normalizedProduct);
}

/**
 * 配列に対するマッチング関数
 * @param filterValues フィルター選択肢の配列
 * @param productValue 商品データの値
 * @returns いずれかがマッチするかどうか
 */
export function isMatchingAny(filterValues: string[], productValue: string): boolean {
  return filterValues.some(filterValue => isMatchingValue(filterValue, productValue));
}
