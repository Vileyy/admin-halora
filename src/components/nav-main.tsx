"use client";
import {
  IconCirclePlusFilled,
  IconMail,
  IconChevronRight,
  type Icon,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  onSelect,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    items?: {
      title: string;
      url: string;
      value?: string;
    }[];
  }[];
  onSelect?: (title: string, subItem?: string, subValue?: string) => void;
}) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "Quản lý sản phẩm": true,
  });

  const handleClick = (
    e: React.MouseEvent,
    item: { title: string; url: string }
  ) => {
    e.preventDefault();
    onSelect?.(item.title);
  };

  const handleSubClick = (
    e: React.MouseEvent,
    parentTitle: string,
    subTitle: string,
    subValue?: string
  ) => {
    e.preventDefault();
    onSelect?.(parentTitle, subTitle, subValue);
  };

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.items ? (
                <>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => toggleItem(item.title)}
                    className="w-full"
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <IconChevronRight
                      className={`ml-auto transition-transform duration-200 ${
                        openItems[item.title] ? "rotate-90" : ""
                      }`}
                    />
                  </SidebarMenuButton>
                  {openItems[item.title] && (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a
                              href={subItem.url}
                              onClick={(e) =>
                                handleSubClick(
                                  e,
                                  item.title,
                                  subItem.title,
                                  subItem.value
                                )
                              }
                            >
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </>
              ) : (
                <SidebarMenuButton asChild tooltip={item.title}>
                  <a href={item.url} onClick={(e) => handleClick(e, item)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
