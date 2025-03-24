"use client"

import { MailIcon, PlusCircleIcon, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    comingSoon?: boolean
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <PlusCircleIcon />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <MailIcon />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                tooltip={item.comingSoon ? `${item.title} (Coming Soon)` : item.title}
                disabled={item.comingSoon}
                className={item.comingSoon ? "cursor-not-allowed" : ""}
              >
                <div className={cn("flex items-center gap-2", item.comingSoon && "opacity-70")}>
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.title}</span>
                  {item.comingSoon && (
                    <Badge 
                      variant="outline" 
                      className="ml-1 px-1.5 py-0 text-[9px] border-amber-500/70 text-amber-600 whitespace-nowrap"
                    >
                      Coming Soon
                    </Badge>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
