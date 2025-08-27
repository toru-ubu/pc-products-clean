import { Product } from '../types/product';

// CPU世代を取得する関数（既存WordPressと完全一致）
export const get_cpu_generation = (cpu_name: string) => {
  // AMD Ryzen 9000シリーズ
  if (/Ryzen [579] 9/.test(cpu_name)) return 'Ryzen 9000シリーズ';
  // AMD Ryzen 8000シリーズ
  if (/Ryzen [579] 8/.test(cpu_name)) return 'Ryzen 8000シリーズ';
  // AMD Ryzen 7000シリーズ
  if (/Ryzen [579] 7/.test(cpu_name)) return 'Ryzen 7000シリーズ';
  // AMD Ryzen 5000シリーズ
  if (/Ryzen [579] 5/.test(cpu_name)) return 'Ryzen 5000シリーズ';
  // AMD Ryzen 4000シリーズ
  if (/Ryzen [579] 4/.test(cpu_name)) return 'Ryzen 4000シリーズ';
  // Intel Core Ultra（最新世代）
  if (cpu_name.toLowerCase().includes('core ultra')) return 'Core Ultra';
  // Intel 14th Gen
  if (/i[3579]-14/.test(cpu_name)) return 'Core i 14th Gen';
  // Intel 13th Gen
  if (/i[3579]-13/.test(cpu_name)) return 'Core i 13th Gen';
  // Intel 12th Gen
  if (/i[3579]-12/.test(cpu_name)) return 'Core i 12th Gen';
  return '旧世代';
};

// GPUシリーズを取得する関数（既存WordPressと完全一致）
export const get_gpu_series = (gpu_name: string) => {
  // RTX 50シリーズ（最新）
  if (/RTX\s*50[0-9]{2}/i.test(gpu_name)) return 'RTX 50シリーズ';
  // RTX 40シリーズ
  if (/RTX\s*40[0-9]{2}/i.test(gpu_name)) return 'RTX 40シリーズ';
  // RTX 30シリーズ
  if (/RTX\s*30[0-9]{2}/i.test(gpu_name)) return 'RTX 30シリーズ';
  // RTX 20シリーズ
  if (/RTX\s*20[0-9]{2}/i.test(gpu_name)) return 'RTX 20シリーズ';
  // GTX 16シリーズ
  if (/GTX\s*16[0-9]{2}/i.test(gpu_name)) return 'GTX 16シリーズ';
  // GTX 10シリーズ
  if (/GTX\s*10[0-9]{2}/i.test(gpu_name)) return 'GTX 10シリーズ';
  // RX 9000シリーズ（最新）
  if (/RX\s*90[0-9]{2}/i.test(gpu_name)) return 'RX 9000シリーズ';
  // RX 7000シリーズ
  if (/RX\s*7[0-9]{3}/i.test(gpu_name)) return 'RX 7000シリーズ';
  // RX 6000シリーズ
  if (/RX\s*6[0-9]{3}/i.test(gpu_name)) return 'RX 6000シリーズ';
  // RX 5000シリーズ
  if (/RX\s*5[0-9]{3}/i.test(gpu_name)) return 'RX 5000シリーズ';
  // Intel Arc
  if (/Arc/i.test(gpu_name)) return 'Intel Arc';
  // 内蔵GPU
  if (/Iris Xe|UHD|760M|780M/i.test(gpu_name)) return '内蔵GPU';
  return 'その他';
};

// ソートを適用する関数
export const applySorting = (products: Product[], sortType: string): Product[] => {
  const sorted = [...products];
  
  switch (sortType) {
    case 'price_asc':
      return sorted.sort((a, b) => a.effectiveprice - b.effectiveprice);
    case 'price_desc':
      return sorted.sort((a, b) => b.effectiveprice - a.effectiveprice);
    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    default:
      return sorted.sort((a, b) => a.effectiveprice - b.effectiveprice); // デフォルトは価格順（安い順）
  }
};
