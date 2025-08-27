"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BrandFormData } from "@/types/Brand";
import Image from "next/image";

interface BrandFormProps {
  onSubmit: (data: BrandFormData) => void;
  loading?: boolean;
  initialData?: Partial<BrandFormData>;
}

export function BrandForm({ onSubmit, loading, initialData }: BrandFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [logoUrl, setLogoUrl] = useState(
    initialData?.logoUrl || initialData?.image || ""
  );
  const [uploading, setUploading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setLogoUrl(data.secure_url || data.url || "");
      toast.success("Upload ảnh thành công!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        "Lỗi upload ảnh: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên thương hiệu!");
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      logoUrl: logoUrl || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name" className="mb-2 block">
          Tên thương hiệu *
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên thương hiệu"
          required
        />
      </div>

      <div>
        <Label htmlFor="description" className="mb-2 block">
          Mô tả
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Nhập mô tả thương hiệu (tùy chọn)"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="logo" className="mb-2 block">
          Logo thương hiệu
        </Label>
        {logoUrl && (
          <div className="mb-2">
            <Image
              src={logoUrl}
              alt="Brand logo preview"
              width={128}
              height={128}
              className="w-32 h-32 object-cover rounded border"
            />
          </div>
        )}
        <Input
          id="logo"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {uploading && (
          <div className="text-sm text-blue-600">Đang upload ảnh...</div>
        )}
      </div>

      <Button
        type="submit"
        disabled={loading || uploading || !name.trim()}
        className="w-full"
      >
        {loading ? "Đang lưu..." : "Lưu thương hiệu"}
      </Button>
    </form>
  );
}
