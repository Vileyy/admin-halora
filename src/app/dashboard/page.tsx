"use client";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ProductsPage from "./products/page";
import CategoriesPage from "./categories/page";
import BrandsPage from "./brands/page";
import OrdersPage from "./orders/page";
import UsersPage from "./users/page";
import RevenuePage from "./revenue/page";
import BannersPage from "./banners/page";
import NotificationsPage from "./notifications/page";
import VoucherPage from "./voucher/page";
import ReviewsPage from "./reviews/page";
import InventoryPage from "./inventory/page";

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
            ) : currentView === "products-flashdeals" ? (
              <ProductsPage category="FlashDeals" />
            ) : currentView === "products-newproduct" ? (
              <ProductsPage category="new_product" />
            ) : currentView === "categories" ? (
              <CategoriesPage />
            ) : currentView === "brands" ? (
              <BrandsPage />
            ) : currentView === "orders" ? (
              <OrdersPage />
            ) : currentView === "users" ? (
              <UsersPage role="user" />
            ) : currentView === "admins" ? (
              <UsersPage role="admin" />
            ) : currentView === "revenue" ? (
              <RevenuePage />
            ) : currentView === "banners" ? (
              <BannersPage />
            ) : currentView === "notifications" ? (
              <NotificationsPage />
            ) : currentView === "vouchers" ? (
              <VoucherPage />
            ) : currentView === "vouchers-shipping" ? (
              <VoucherPage type="shipping" />
            ) : currentView === "vouchers-product" ? (
              <VoucherPage type="product" />
            ) : currentView === "reviews" ? (
              <ReviewsPage />
            ) : currentView === "inventory" ? (
              <InventoryPage />
            ) : (
              <div>
                <h1>404</h1>
                <p>Không tìm thấy trang</p>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
