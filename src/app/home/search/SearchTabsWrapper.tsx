"use client";

import Tabs, { TabItem } from "@/components/Tabs";
import { useSearchParams } from "next/navigation";

export default function SearchTabsWrapper() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q')?.split('/')[0] || '';

    // Extract current tab from URL
    const fullQuery = searchParams.get('q') || '';
    const parts = fullQuery.split('/');
    const currentTab = parts.length > 1 ? parts[1] : 'lists';

    const tabsForNav: TabItem[] = [
        {
            id: "lists",
            label: "Lijsten",
            content: <></>, // Dummy content, as renderContent will be false
        },
        {
            id: "summaries",
            label: "Samenvattingen",
            content: <></>,
        },
        {
            id: "forum",
            label: "Forum",
            content: <></>,
        },
        {
            id: "groups",
            label: "Groepen",
            content: <></>,
        },
    ];

    return (
        <>
            <h1 className="text-2xl font-bold px-6 mb-4">
                Zoekresultaten voor: <span className="text-sky-400">{query}</span>
            </h1>
            <div className="pl-4">
                <Tabs
                    tabs={tabsForNav}
                    defaultActiveTab={currentTab}
                    withRoutes={true}
                    baseRoute="/home/search"
                    currentQuery={query}
                    renderContent={false} // Key: This instance won't render content directly
                />
            </div>
        </>
    );
}
