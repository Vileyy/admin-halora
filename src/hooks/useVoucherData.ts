import { useState, useEffect, useCallback } from "react";
import { VoucherService } from "@/services/voucherService";
import { Voucher, VoucherStats, VoucherFormData } from "@/types/Voucher";

interface UseVoucherDataReturn {
  vouchers: Voucher[];
  loading: boolean;
  error: string | null;
  stats: VoucherStats;
  createVoucher: (voucherData: VoucherFormData) => Promise<void>;
  updateVoucherStatus: (
    id: string,
    status: "active" | "inactive"
  ) => Promise<void>;
  deleteVoucher: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useVoucherData(
  type?: "shipping" | "product"
): UseVoucherDataReturn {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats based on vouchers
  const stats: VoucherStats = {
    totalVouchers: vouchers.length,
    activeVouchers: vouchers.filter((v) => v.status === "active").length,
    expiredVouchers: vouchers.filter((v) => v.status === "expired").length,
    totalUsage: vouchers.reduce((sum, v) => sum + v.usageCount, 0),
  };

  // Subscribe to real-time updates
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = VoucherService.subscribeToVouchers(
      (updatedVouchers) => {
        try {
          const filteredVouchers = type
            ? updatedVouchers.filter((v) => v.type === type)
            : updatedVouchers;

          setVouchers(filteredVouchers);
          setLoading(false);
        } catch (err) {
          console.error("Error processing voucher updates:", err);
          setError("Failed to load vouchers");
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, [type]);

  // Create new voucher
  const createVoucher = useCallback(async (voucherData: VoucherFormData) => {
    try {
      setError(null);

      // Check if code is unique
      const isUnique = await VoucherService.isCodeUnique(voucherData.code);
      if (!isUnique) {
        throw new Error("Mã voucher đã tồn tại");
      }

      await VoucherService.createVoucher(voucherData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create voucher";
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update voucher status
  const updateVoucherStatus = useCallback(
    async (id: string, status: "active" | "inactive") => {
      try {
        setError(null);
        await VoucherService.updateVoucherStatus(id, status);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update voucher status";
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  // Delete voucher
  const deleteVoucher = useCallback(async (id: string) => {
    try {
      setError(null);
      await VoucherService.deleteVoucher(id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete voucher";
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allVouchers = await VoucherService.getAllVouchers();
      const filteredVouchers = type
        ? allVouchers.filter((v) => v.type === type)
        : allVouchers;
      setVouchers(filteredVouchers);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh vouchers";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [type]);

  return {
    vouchers,
    loading,
    error,
    stats,
    createVoucher,
    updateVoucherStatus,
    deleteVoucher,
    refresh,
  };
}

// Hook for filtering and searching vouchers
interface UseVoucherFilterReturn {
  filteredVouchers: Voucher[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
}

export function useVoucherFilter(vouchers: Voucher[]): UseVoucherFilterReturn {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Filter vouchers based on search and filters
  const filteredVouchers = vouchers.filter((voucher) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.title.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || voucher.status === statusFilter;

    // Type filter
    const matchesType = typeFilter === "all" || voucher.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return {
    filteredVouchers,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
  };
}
