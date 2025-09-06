export interface Voucher {
  id: string;
  code: string;
  title: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrder: number;
  usageLimit: number;
  usageCount: number;
  startDate: number; // timestamp
  endDate: number; // timestamp
  status: "active" | "inactive" | "expired";
  type: "shipping" | "product";
  createdAt?: number; // timestamp
  updatedAt?: number; // timestamp
}

export interface VoucherFormData {
  code: string;
  title: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrder: number;
  usageLimit: number;
  startDate: string; // ISO date string for form input
  endDate: string; // ISO date string for form input
  status: "active" | "inactive";
  type: "shipping" | "product";
}

export interface VoucherStats {
  totalVouchers: number;
  activeVouchers: number;
  totalUsage: number;
  expiredVouchers: number;
}
