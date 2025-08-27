"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database } from "@/lib/firebase";
import { ref, onValue, push, set, remove } from "firebase/database";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Brand, BrandFormData } from "@/types/Brand";
import { BrandForm } from "@/components/admin/brands/BrandForm";
import { BrandTable } from "@/components/admin/brands/BrandTable";
import { IconPlus } from "@tabler/icons-react";

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);

  useEffect(() => {
    const brandsRef = ref(database, "brands");
    const unsubscribe = onValue(
      brandsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setBrands([]);
          setInitialLoading(false);
          return;
        }

        const brandsArray = Object.entries(data)
          .map(([id, value]: [string, unknown]) => {
            if (typeof value === "object" && value !== null) {
              const v = value as {
                name?: string;
                description?: string;
                logoUrl?: string;
                image?: string; 
              };
              if (v.name || v.image || v.logoUrl) {
                const brand: Brand = {
                  id,
                  name: v.name || `Brand ${id.slice(-4)}`,
                  description: v.description,
                  logoUrl: v.logoUrl || v.image,
                  image: v.image,
                };
                return brand;
              }
            }
            return null;
          })
          .filter((item): item is Brand => item !== null);

        setBrands(brandsArray);
        setInitialLoading(false);
      },
      (error) => {
        setInitialLoading(false);
        toast.error("Lỗi khi tải danh sách thương hiệu!");
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAddBrand = async (data: BrandFormData) => {
    try {
      setLoading(true);
      const brandsRef = ref(database, "brands");
      const result = await push(brandsRef, data);

      if (result.key) {
        // Manually add the new brand to state for immediate UI update
        const newBrand: Brand = {
          id: result.key,
          name: data.name,
          description: data.description,
          logoUrl: data.logoUrl,
        };
        setBrands((prev) => [...prev, newBrand]);
      }

      setLoading(false);
      setOpen(false);
      toast.success("Thêm thương hiệu thành công!");
    } catch {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi thêm thương hiệu!");
    }
  };

  const handleEditBrand = async (brandId: string, data: BrandFormData) => {
    try {
      setLoading(true);
      await set(ref(database, `brands/${brandId}`), data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      setEditDialogOpen(null);
      toast.success("Cập nhật thương hiệu thành công!");
    } catch {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi cập nhật!");
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    try {
      setLoading(true);
      await remove(ref(database, `brands/${brandId}`));
      setLoading(false);
      setDeleteDialogOpen(null);
      toast.success("Xóa thương hiệu thành công!");
    } catch {
      setLoading(false);
      toast.error("Có lỗi xảy ra khi xóa thương hiệu!");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quản lý thương hiệu</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>
              <IconPlus className="w-4 h-4 mr-2" />
              Thêm thương hiệu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>Thêm thương hiệu mới</DialogTitle>
            </DialogHeader>
            <div className="p-2">
              <BrandForm onSubmit={handleAddBrand} loading={loading} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thương hiệu ({brands.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {initialLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">
                  Đang tải danh sách thương hiệu...
                </p>
              </div>
            </div>
          ) : (
            <BrandTable
              brands={brands}
              loading={loading}
              onEdit={handleEditBrand}
              onDelete={handleDeleteBrand}
              editDialogOpen={editDialogOpen}
              setEditDialogOpen={setEditDialogOpen}
              deleteDialogOpen={deleteDialogOpen}
              setDeleteDialogOpen={setDeleteDialogOpen}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
