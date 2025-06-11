"use client";
import { usePathname } from "next/navigation";
import Tabs, { TabItem } from "@/components/Tabs";
import ForumDialog from "@/app/home/forum/ForumDialog";

interface ForumHeaderTabsProps {
    tabs: TabItem[];
    defaultTab: string;
    baseRoute: string;
    banned: boolean;
}

export default function ForumHeaderTabs({ tabs, defaultTab, baseRoute, banned }: ForumHeaderTabsProps) {
    const pathname = usePathname() || "";
    const segments = pathname.split('/');
    const segment = segments[3] || ""; // after /home/forum

    // Determine which tab to activate based on URL or fallback to default
    const urlTab = tabs.some(tab => tab.id === segment) ? segment : defaultTab;
    // Show header and tabs only on valid tab routes or root forum
    const isTabRoute = urlTab !== undefined;
    if (!isTabRoute) {
        return null;
    }

    return (
        <>
            {/* Header row */}
            <div className="py-6 px-6">
                <div className="flex items-center">
                    <h1 className="text-4xl font-extrabold">Forum</h1>
                    <div className="flex-grow" />
                    <ForumDialog banned={banned} banreason={undefined} banEnd={undefined} />
                </div>
            </div>

            {/* Tabs bar */}
            <div className="border-b border-neutral-700 pl-6">
                <Tabs
                    key={urlTab}
                    tabs={tabs}
                    defaultActiveTab={urlTab}
                    withRoutes={true}
                    baseRoute={baseRoute}
                    renderContent={false}
                />
            </div>
        </>
    );
}
