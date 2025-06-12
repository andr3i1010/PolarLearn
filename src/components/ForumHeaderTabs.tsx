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
    // Only render header on recognized tab routes or the root forum path
    const allowedTabs = tabs.map(tab => tab.id);
    if (segment !== "" && !allowedTabs.includes(segment)) {
        return null;
    }
    const urlTab = segment || defaultTab;

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
            <div className="px-6">
                <Tabs
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
