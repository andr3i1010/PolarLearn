"use client"

import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
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
                {/* Show trigger on mobile devices */}
                {isMobile && (
                    <div className="mb-4">
                        <SidebarTrigger
                            className="p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        />
                    </div>
                )}
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
