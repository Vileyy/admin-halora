"use client";
import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  // IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconStar,
  IconTicket,
  IconUsers,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Viley",
    email: "viley@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Quản lý sản phẩm",
      url: "#",
      icon: IconDatabase,
      items: [
        {
          title: "FlashDeals",
          url: "#",
        },
        {
          title: "Sản phẩm mới",
          url: "#",
          value: "new_product",
        },
      ],
    },
    {
      title: "Quản lý voucher",
      url: "#",
      icon: IconTicket,
      items: [
        {
          title: "Voucher phí vận chuyển",
          url: "#",
          value: "shipping_discount",
        },
        {
          title: "Mã giảm giá sản phẩm",
          url: "#",
          value: "product_discount",
        },
      ],
    },
    {
      title: "Quản lý danh mục",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Quản lý thương hiệu",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Quản lý đơn hàng",
      url: "#",
      icon: IconReport,
    },
    {
      title: "Quản lý người dùng",
      url: "#",
      icon: IconUsers,
    },
    {
      title: "Quản lý doanh thu",
      url: "#",
      icon: IconChartBar,
    },
    {
      title: "Quản lý banner",
      url: "#",
      icon: IconCamera,
    },
    {
      title: "Quản lý thông báo",
      url: "#",
      icon: IconFileDescription,
    },
    {
      title: "Quản lý đánh giá",
      url: "#",
      icon: IconStar,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
};

export function AppSidebar({
  onMenuClick,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onMenuClick?: (view: string) => void;
}) {
  const handleNavClick = (
    title: string,
    subItem?: string,
    subValue?: string
  ) => {
    if (title === "Quản lý sản phẩm") {
      if (subItem === "FlashDeals") {
        onMenuClick?.("products-flashdeals");
      } else if (subItem === "Sản phẩm mới" || subValue === "new_product") {
        onMenuClick?.("products-newproduct");
      } else {
        onMenuClick?.("products");
      }
    }
    if (title === "Quản lý danh mục") {
      onMenuClick?.("categories");
    }
    if (title === "Quản lý thương hiệu") {
      onMenuClick?.("brands");
    }
    if (title === "Quản lý đơn hàng") {
      onMenuClick?.("orders");
    }
    if (title === "Quản lý người dùng") {
      onMenuClick?.("users");
    }
    if (title === "Quản lý doanh thu") {
      onMenuClick?.("revenue");
    }
    if (title === "Quản lý banner") {
      onMenuClick?.("banners");
    }
    if (title === "Quản lý thông báo") {
      onMenuClick?.("notifications");
    }
    if (title === "Quản lý đánh giá") {
      onMenuClick?.("reviews");
    }
    if (title === "Quản lý voucher") {
      if (
        subItem === "Voucher phí vận chuyển" ||
        subValue === "shipping_discount"
      ) {
        onMenuClick?.("vouchers-shipping");
      } else if (
        subItem === "Mã giảm giá sản phẩm" ||
        subValue === "product_discount"
      ) {
        onMenuClick?.("vouchers-product");
      } else {
        onMenuClick?.("vouchers");
      }
    }
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Doãn Quốc Hiếu</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} onSelect={handleNavClick} />
        {/* <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
