"use client"

import { User, Settings, Bell, Shield } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar
} from "@/components/ui/sidebar"
const items = [
    {
        title: "Account",
        url: "/home/settings/account",
        icon: User,
    },
    {
        title: "Foruminstellingen",
        url: "/home/settings/forum",
        icon: Settings,
    },
    {
        title: "Berichten",
        url: "/home/settings/notifications",
        icon: Bell,
    },
    {
        title: "Privacy",
        url: "/home/settings/privacy",
        icon: Shield,
    }
]

export function SettingsSidebar() {
    const pathname = usePathname()
    const { state } = useSidebar()

    // Dynamic width based on sidebar state
    const sidebarWidth = state === "expanded" ? "w-64" : "w-12"

    return (
        <Sidebar
            className={`fixed top-16 h-[calc(100vh-4rem)] ${sidebarWidth} z-30 border-r border-border bg-neutral-800 transition-all duration-200`}
            collapsible="icon"
        >
            <SidebarContent>
                <div className="flex items-center justify-end p-2">
                    <SidebarTrigger
                        className="text-white hover:bg-neutral-700"
                    />
                </div>
                <SidebarGroup>
                    <SidebarGroupLabel>Instellingen</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => {
                                const isActive = pathname === item.url

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            className={isActive ? "bg-accent" : ""}
                                        >
                                            <Link href={item.url}>
                                                {item.icon && <item.icon size={18} />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}