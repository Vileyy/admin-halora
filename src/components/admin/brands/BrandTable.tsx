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
}: BrandTableProps) {
  return (
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
        {brands.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center py-8 text-muted-foreground"
            >
              Chưa có thương hiệu nào. Hãy thêm thương hiệu đầu tiên!
            </TableCell>
          </TableRow>
        ) : (
          brands.map((brand) => (
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
                          {brand.name}&quot; không? Hành động này không thể hoàn
                          tác.
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
  );
}
