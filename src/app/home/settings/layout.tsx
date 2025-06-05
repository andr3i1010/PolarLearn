"use client"

import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { SettingsSidebar } from "@/app/home/settings/sidebar"

// Create a client component for the content area that responds to sidebar state
function SettingsContent({ children }: { children: React.ReactNode }) {
    const { state, isMobile } = useSidebar()

    return (
        <main
            className={`transition-all duration-200 ${
                // On desktop: adjust margin based on sidebar state
                !isMobile ?
                    (state === "expanded" ? "ml-0 md:ml-64" : "ml-0 md:ml-12") :
                    "ml-0" // On mobile: no margin
                }`}
        >
            <div className="p-6">
                {children}
            </div>
        </main>
    )
}

// Root layout component
export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="relative">
                <SettingsSidebar />
                <SettingsContent>
                    {children}
                </SettingsContent>
            </div>
        </SidebarProvider>
    )
}
