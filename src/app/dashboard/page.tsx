"use client";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ProductsPage from "./products/page";
import CategoriesPage from "./categories/page";
import BrandsPage from "./brands/page";
import OrdersPage from "./orders/page";

import data from "./data.json";

export default function Page() {
  const [currentView, setCurrentView] = useState("products");

  const handleMenuClick = (view: string) => {
    setCurrentView(view);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" onMenuClick={handleMenuClick} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {currentView === "products" ? (
              <ProductsPage />
            ) : currentView === "categories" ? (
              <CategoriesPage />
            ) : currentView === "brands" ? (
              <BrandsPage />
            ) : currentView === "orders" ? (
              <OrdersPage />
            ) : (
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards />
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>
                <DataTable data={data} />
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
