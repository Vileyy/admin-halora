import { NextResponse } from "next/server";
import {
  syncProductsToInventory,
  compareInventoryWithProducts,
} from "@/services/syncService";

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action === "sync") {
      const result = await syncProductsToInventory();

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Đã đồng bộ hóa ${result.syncedCount} sản phẩm thành công!`
          : "Có lỗi xảy ra khi đồng bộ dữ liệu!",
        data: {
          syncedCount: result.syncedCount,
          errors: result.errors,
        },
      });
    }

    if (action === "compare") {
      const result = await compareInventoryWithProducts();

      return NextResponse.json({
        success: true,
        message:
          result.totalDifferences === 0
            ? "Không có sự khác biệt về số lượng tồn kho!"
            : `Tìm thấy ${result.totalDifferences} sự khác biệt về tồn kho.`,
        data: {
          differences: result.differences,
          totalDifferences: result.totalDifferences,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: "Action không hợp lệ!" },
      { status: 400 }
    );
  } catch (error) {
    console.error("API sync error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Có lỗi xảy ra khi xử lý yêu cầu!",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return current sync status and comparison
    const result = await compareInventoryWithProducts();

    return NextResponse.json({
      success: true,
      data: {
        differences: result.differences,
        totalDifferences: result.totalDifferences,
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("API get sync status error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Có lỗi xảy ra khi kiểm tra trạng thái!",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
