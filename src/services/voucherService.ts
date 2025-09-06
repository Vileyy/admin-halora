import { database } from "@/lib/firebase";
import {
  ref,
  push,
  set,
  get,
  onValue,
  off,
  DatabaseReference,
} from "firebase/database";
import { Voucher, VoucherFormData } from "@/types/Voucher";

const VOUCHERS_PATH = "vouchers";

export class VoucherService {
  private static getVouchersRef(): DatabaseReference {
    return ref(database, VOUCHERS_PATH);
  }

  private static getVoucherRef(id: string): DatabaseReference {
    return ref(database, `${VOUCHERS_PATH}/${id}`);
  }

  /**
   * Create a new voucher
   */
  static async createVoucher(voucherData: VoucherFormData): Promise<string> {
    try {
      const vouchersRef = this.getVouchersRef();
      const newVoucherRef = push(vouchersRef);

      const voucher: Omit<Voucher, "id"> = {
        ...voucherData,
        startDate: new Date(voucherData.startDate).getTime(),
        endDate: new Date(voucherData.endDate).getTime(),
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await set(newVoucherRef, voucher);
      return newVoucherRef.key!;
    } catch (error) {
      console.error("Error creating voucher:", error);
      throw new Error("Failed to create voucher");
    }
  }

  /**
   * Get all vouchers
   */
  static async getAllVouchers(): Promise<Voucher[]> {
    try {
      const vouchersRef = this.getVouchersRef();
      const snapshot = await get(vouchersRef);

      if (!snapshot.exists()) {
        return [];
      }

      const vouchersData = snapshot.val();
      const vouchers: Voucher[] = Object.keys(vouchersData).map((id) => ({
        id,
        ...vouchersData[id],
      }));

      // Update expired vouchers
      const now = Date.now();
      const updatedVouchers = vouchers.map((voucher) => ({
        ...voucher,
        status: voucher.endDate < now ? ("expired" as const) : voucher.status,
      }));

      return updatedVouchers;
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      throw new Error("Failed to fetch vouchers");
    }
  }

  /**
   * Get vouchers by type
   */
  static async getVouchersByType(   
    type: "shipping" | "product"
  ): Promise<Voucher[]> {
    const allVouchers = await this.getAllVouchers();
    return allVouchers.filter((voucher) => voucher.type === type);
  }

  /**
   * Subscribe to real-time voucher updates
   */
  static subscribeToVouchers(
    callback: (vouchers: Voucher[]) => void
  ): () => void {
    const vouchersRef = this.getVouchersRef();

    const unsubscribe = onValue(
      vouchersRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback([]);
          return;
        }

        const vouchersData = snapshot.val();
        const vouchers: Voucher[] = Object.keys(vouchersData).map((id) => ({
          id,
          ...vouchersData[id],
        }));

        // Update expired vouchers
        const now = Date.now();
        const updatedVouchers = vouchers.map((voucher) => ({
          ...voucher,
          status: voucher.endDate < now ? ("expired" as const) : voucher.status,
        }));

        callback(updatedVouchers);
      },
      (error) => {
        console.error("Error listening to vouchers:", error);
        callback([]);
      }
    );

    return () => off(vouchersRef, "value", unsubscribe);
  }

  /**
   * Update voucher usage count
   */
  static async incrementUsageCount(voucherId: string): Promise<void> {
    try {
      const voucherRef = this.getVoucherRef(voucherId);
      const snapshot = await get(voucherRef);

      if (!snapshot.exists()) {
        throw new Error("Voucher not found");
      }

      const voucher = snapshot.val();
      const updatedUsageCount = (voucher.usageCount || 0) + 1;

      await set(
        ref(database, `${VOUCHERS_PATH}/${voucherId}/usageCount`),
        updatedUsageCount
      );
      await set(
        ref(database, `${VOUCHERS_PATH}/${voucherId}/updatedAt`),
        Date.now()
      );
    } catch (error) {
      console.error("Error updating usage count:", error);
      throw new Error("Failed to update voucher usage");
    }
  }

  /**
   * Update voucher status
   */
  static async updateVoucherStatus(
    voucherId: string,
    status: "active" | "inactive"
  ): Promise<void> {
    try {
      const voucherRef = this.getVoucherRef(voucherId);
      await set(ref(database, `${VOUCHERS_PATH}/${voucherId}/status`), status);
      await set(
        ref(database, `${VOUCHERS_PATH}/${voucherId}/updatedAt`),
        Date.now()
      );
    } catch (error) {
      console.error("Error updating voucher status:", error);
      throw new Error("Failed to update voucher status");
    }
  }

  /**
   * Delete a voucher
   */
  static async deleteVoucher(voucherId: string): Promise<void> {
    try {
      const voucherRef = this.getVoucherRef(voucherId);
      await set(voucherRef, null);
    } catch (error) {
      console.error("Error deleting voucher:", error);
      throw new Error("Failed to delete voucher");
    }
  }

  /**
   * Validate voucher code uniqueness
   */
  static async isCodeUnique(
    code: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const vouchers = await this.getAllVouchers();
      return !vouchers.some(
        (voucher) =>
          voucher.code.toLowerCase() === code.toLowerCase() &&
          voucher.id !== excludeId
      );
    } catch (error) {
      console.error("Error checking code uniqueness:", error);
      return false;
    }
  }
}
