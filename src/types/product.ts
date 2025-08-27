export interface Product {
  id: string;
  name: string;
  maker: string;
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
  discountrate: number;
  shippingFee: number;
  category: string;
  createdAt: Date | string;
  updatedAt: Date | string;
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
