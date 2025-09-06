"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

interface StockStatusProps {
  stockQty: number;
  variant: string;
  className?: string;
}

export function StockStatus({
  stockQty,
  variant,
  className = "",
}: StockStatusProps) {
  const getStatusColor = () => {
    if (stockQty === 0) return "text-red-600";
    if (stockQty < 10) return "text-orange-600";
    return "text-green-600";
  };

  const getStatusBadge = () => {
    if (stockQty === 0) {
      return (
        <Badge variant="destructive" className="text-xs ml-2">
          Hết hàng
        </Badge>
      );
    }
    if (stockQty < 10) {
      return (
        <Badge
          variant="secondary"
          className="text-xs ml-2 bg-orange-100 text-orange-800"
        >
          Sắp hết
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="text-xs ml-2 bg-green-100 text-green-800"
      >
        Còn hàng
      </Badge>
    );
  };

  return (
    <div className={`flex items-center ${className}`}>
      <span className={`text-xs font-medium ${getStatusColor()}`}>
        {variant}: {stockQty} cái
      </span>
      {getStatusBadge()}
    </div>
  );
}
