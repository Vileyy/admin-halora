"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brand, BrandFormData } from "@/types/Brand";
import { BrandForm } from "./BrandForm";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import Image from "next/image";

interface BrandTableProps {
  brands: Brand[];
  loading: boolean;
  onEdit: (brandId: string, data: BrandFormData) => void;
  onDelete: (brandId: string) => void;
  editDialogOpen: string | null;
  setEditDialogOpen: (id: string | null) => void;
  deleteDialogOpen: string | null;
  setDeleteDialogOpen: (id: string | null) => void;
  resetPagination?: boolean;
}

export function BrandTable({
  brands,
  loading,
  onEdit,
  onDelete,
  editDialogOpen,
  setEditDialogOpen,
  deleteDialogOpen,
  setDeleteDialogOpen,
  resetPagination,
}: BrandTableProps) {
  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const [jumpToPage, setJumpToPage] = React.useState("");
  const itemsPerPage = 6;

  // Reset to page 1 when resetPagination changes
  React.useEffect(() => {
    if (resetPagination) {
      setCurrentPage(1);
    }
  }, [resetPagination]);

  // Pagination logic
  const totalPages = Math.ceil(brands.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBrands = brands.slice(startIndex, endIndex);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Logo</TableHead>
            <TableHead>Tên thương hiệu</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead className="w-32">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedBrands.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-8 text-muted-foreground"
              >
                Chưa có thương hiệu nào. Hãy thêm thương hiệu đầu tiên!
              </TableCell>
            </TableRow>
          ) : (
            paginatedBrands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell>
                  {brand.logoUrl ? (
                    <Image
                      src={brand.logoUrl}
                      alt={brand.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                      <span className="text-xs text-gray-500">No Logo</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{brand.name}</TableCell>
                <TableCell className="max-w-xs">
                  {brand.description ? (
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {brand.description}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Chưa có mô tả
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog
                      open={editDialogOpen === brand.id}
                      onOpenChange={(open) =>
                        setEditDialogOpen(open ? brand.id : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditDialogOpen(brand.id)}
                        >
                          <IconEdit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg w-full">
                        <DialogHeader>
                          <DialogTitle>Sửa thương hiệu</DialogTitle>
                        </DialogHeader>
                        <div className="p-2">
                          <BrandForm
                            onSubmit={(data) => onEdit(brand.id, data)}
                            loading={loading}
                            initialData={brand}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog
                      open={deleteDialogOpen === brand.id}
                      onOpenChange={(open) =>
                        setDeleteDialogOpen(open ? brand.id : null)
                      }
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteDialogOpen(brand.id)}
                        >
                          <IconTrash className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Xác nhận xóa thương hiệu
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa thương hiệu &quot;
                            {brand.name}&quot; không? Hành động này không thể
                            hoàn tác.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={loading}>
                            Hủy
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(brand.id)}
                            disabled={loading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {loading ? "Đang xóa..." : "Xóa"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {brands.length > 0 && totalPages > 1 && (
        <div className="mt-6 p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, brands.length)} /{" "}
              {brands.length} thương hiệu
            </div>

            <div className="flex items-center space-x-3">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                ← Trước
              </Button>

              {/* Page Numbers - Show max 5 pages */}
              <div className="flex items-center space-x-1">
                {(() => {
                  const maxVisible = 5;
                  const start = Math.max(
                    1,
                    currentPage - Math.floor(maxVisible / 2)
                  );
                  const end = Math.min(totalPages, start + maxVisible - 1);
                  const pages = [];

                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant={currentPage === i ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(i)}
                        className={`h-8 w-8 p-0 ${
                          currentPage === i
                            ? "bg-blue-600 text-white font-bold"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {i}
                      </Button>
                    );
                  }
                  return pages;
                })()}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 px-3"
              >
                Sau →
              </Button>

              {/* Jump to Page Input */}
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-sm text-gray-600">Đến trang:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  placeholder="Số trang"
                  className="w-20 h-8 text-center border border-gray-300 rounded px-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const targetPage = parseInt(jumpToPage);
                      if (targetPage >= 1 && targetPage <= totalPages) {
                        setCurrentPage(targetPage);
                        setJumpToPage("");
                      }
                    }
                  }}
                />
                <span className="text-sm text-gray-500">/ {totalPages}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
