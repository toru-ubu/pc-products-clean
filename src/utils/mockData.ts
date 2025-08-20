import { Product } from '../lib/firebase';

// モックデータ（Firebase接続エラー時のフォールバック）
export function getMockProducts(): Product[] {
  return [
    {
      id: 'mock1',
      name: 'GALLERIA XA7C-R47S Core i7-14700KF/RTX4070 Super/32GBメモリ/1TB Gen4 SSD',
      maker: 'ドスパラ',
      type: 'デスクトップ',
      price: 259980,
      effectiveprice: 239980,
      cpu: 'Core i7-14700KF',
      gpu: 'RTX 4070 Super (12GB)',
      memory: '32GB',
      storage: '1TB Gen4 SSD',
      imageUrl: 'https://picsum.photos/300/200?random=1',
      productUrl: 'https://www.dospara.co.jp/5shopping/detail_prime.php?tg=13&tc=30&ft=&mc=12345',
      isActive: true,
      campaigns: [
        { type: 'クーポン', amount: 20000 },
        { type: 'ポイント', amount: 2399 }
      ],
      campaignIds: [],
      discountrate: 8,
      shippingFee: 0,
      regularPoint: 2399,
      category: 'ゲーミングPC',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: 'mock2',
      name: 'LEVEL-R779-LC137KF-UL2X Core i7-13700KF/RTX4080/32GBメモリ/1TB M.2 SSD',
      maker: 'パソコン工房',
      type: 'デスクトップ',
      price: 329980,
      effectiveprice: 309980,
      cpu: 'Core i7-13700KF',
      gpu: 'RTX 4080 (16GB)',
      memory: '32GB',
      storage: '1TB M.2 SSD',
      imageUrl: 'https://picsum.photos/300/200?random=2',
      productUrl: 'https://www.pc-koubou.jp/products/detail.php?product_id=12345',
      isActive: true,
      campaigns: [
        { type: 'セール', amount: 20000 }
      ],
      campaignIds: [],
      discountrate: 6,
      shippingFee: 0,
      regularPoint: 3299,
      category: 'ゲーミングPC',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18')
    },
    {
      id: 'mock3',
      name: 'G-Master Spear Z790/D5 Core i5-14600KF/RTX4060Ti/16GBメモリ/1TB M.2 SSD',
      maker: 'サイコム',
      type: 'デスクトップ',
      price: 199980,
      effectiveprice: 189980,
      cpu: 'Core i5-14600KF',
      gpu: 'RTX 4060 Ti (16GB)',
      memory: '16GB',
      storage: '1TB M.2 SSD',
      imageUrl: 'https://picsum.photos/300/200?random=3',
      productUrl: 'https://www.sycom.co.jp/custom/model?no=000012345',
      isActive: true,
      campaigns: [],
      campaignIds: [],
      discountrate: 5,
      shippingFee: 2200,
      regularPoint: 1899,
      category: 'ゲーミングPC',
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-19')
    },
    {
      id: 'mock4',
      name: 'FRGKB760/SG12 Core i7-14700KF/RTX4070/32GBメモリ/1TB M.2 SSD',
      maker: 'フロンティア',
      type: 'デスクトップ',
      price: 279800,
      effectiveprice: 259800,
      cpu: 'Core i7-14700KF',
      gpu: 'RTX 4070 (12GB)',
      memory: '32GB',
      storage: '1TB M.2 SSD',
      imageUrl: 'https://picsum.photos/300/200?random=4',
      productUrl: 'https://www.frontier-direct.jp/direct/g/g12345/',
      isActive: true,
      campaigns: [
        { type: 'クーポン', amount: 20000 }
      ],
      campaignIds: [],
      discountrate: 7,
      shippingFee: 0,
      regularPoint: 2598,
      category: 'ゲーミングPC',
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-16')
    },
    {
      id: 'mock5',
      name: 'Legion Tower 7i Core i7-14700KF/RTX4080 Super/32GBメモリ/1TB SSD',
      maker: 'レノボ',
      type: 'デスクトップ',
      price: 399800,
      effectiveprice: 359800,
      cpu: 'Core i7-14700KF',
      gpu: 'RTX 4080 Super (16GB)',
      memory: '32GB',
      storage: '1TB SSD',
      imageUrl: 'https://picsum.photos/300/200?random=5',
      productUrl: 'https://www.lenovo.com/jp/ja/desktops/legion-desktops/legion-t-series/Legion-Tower-7i-Gen-8/p/12345',
      isActive: true,
      campaigns: [
        { type: 'ポイント', amount: 7196 }
      ],
      campaignIds: [],
      discountrate: 10,
      shippingFee: 0,
      regularPoint: 3598,
      category: 'ゲーミングPC',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-14')
    }
  ];
}
