"use client";

import Tabs, { TabItem } from "@/components/Tabs";
import { Users, ListTodo, School } from "lucide-react";

interface AdminNavWrapperProps {
    defaultActiveTab: string;
}

export default function AdminNavWrapper({ defaultActiveTab }: AdminNavWrapperProps) {
    const tabsForNav: TabItem[] = [
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
            defaultActiveTab={defaultActiveTab}
            withRoutes={true}
            baseRoute="/admin"
            renderContent={false} // Key: This instance of Tabs won't render content directly
        />
    );
}
