"use client";

import Tabs, { TabItem } from "@/components/Tabs";
import { Users, ListTodo, School, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

interface AdminNavWrapperProps {
    defaultActiveTab: string;
}

export default function AdminNavWrapper({ defaultActiveTab }: AdminNavWrapperProps) {
    const pathname = usePathname() || "";
    const segments = pathname.split('/');
    const segment = segments[2] || ""; // after /admin

    // Get the current tab from URL, fallback to defaultActiveTab
    const currentTab = segment || defaultActiveTab;
    const tabsForNav: TabItem[] = [
        {
            id: "algemeen",
            label: <div className="flex items-center gap-2"><Settings size={16} /><span>Algemeen</span></div>,
            content: <></>, // Dummy content, as renderContent will be false in Tabs
        },
        {
            id: "gebruikers",
            label: <div className="flex items-center gap-2"><Users size={16} /><span>Gebruikers</span></div>,
            content: <></>, // Dummy content, as renderContent will be false in Tabs
        },
        {
            id: "lijsten",
            label: <div className="flex items-center gap-2"><ListTodo size={16} /><span>Lijsten</span></div>,
            content: <></>,
        },
        {
            id: "groepen",
            label: <div className="flex items-center gap-2"><School size={16} /><span>Groepen</span></div>,
            content: <></>,
        },
        {
            id: "jwe",
            label: "JWE decodeerder",
            content: <></>,
        },
    ];

    return (
        <Tabs
            tabs={tabsForNav}
            defaultActiveTab={currentTab}
            withRoutes={true}
            baseRoute="/admin"
            renderContent={false} // Key: This instance of Tabs won't render content directly
        />
    );
}
