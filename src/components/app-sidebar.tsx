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
    },
    {
      title: "Danh mục",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Thương hiệu",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Quản lý đơn hàng",
      url: "#",
      icon: IconReport,
    },
    {
      title: "Người dùng",
      url: "#",
      icon: IconUsers,
    },
    {
      title: "Doanh thu",
      url: "#",
      icon: IconChartBar,
    },
    {
      title: "Banner",
      url: "#",
      icon: IconCamera,
    },
    {
      title: "Thông báo",
      url: "#",
      icon: IconFileDescription,
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
  const handleNavClick = (title: string) => {
    if (title === "Quản lý sản phẩm") {
      onMenuClick?.("products");
    }
    if (title === "Danh mục") {
      onMenuClick?.("categories");
    }
    if (title === "Thương hiệu") {
      onMenuClick?.("brands");
    }
    if (title === "Quản lý đơn hàng") {
      onMenuClick?.("orders");
    }
    if (title === "Người dùng") {
      onMenuClick?.("users");
    }
    if (title === "Doanh thu") {
      onMenuClick?.("revenue");
    }
    if (title === "Banner") {
      onMenuClick?.("banners");
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
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
