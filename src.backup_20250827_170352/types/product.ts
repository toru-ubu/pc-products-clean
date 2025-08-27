export interface Product {
  id: string;
  name: string;
  maker: string;
  type: string; // PC形状（デスクトップ・ノートブック）
  price: number;
  effectiveprice: number;
  cpu: string;
  gpu: string;
  memory: string;
  storage: string;
  imageUrl: string;
  productUrl: string;
  isActive: boolean;
  campaigns: Array<{
    type: string;
    amount: number;
  }>;
  campaignIds: string[];
  discountrate: number;
  shippingFee: number;
  regularPoint: number;
  category: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface FilterState {
  maker: string[];
  cpu: string[];
  gpu: string[];
  memory: string[];
  storage: string[];
  priceMin: number;
  priceMax: number;
}

export interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
