"use client";

import Tabs, { TabItem } from "@/components/Tabs";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

export default function SearchTabsWrapper() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    // `?q=searchTerm`
    const query = searchParams.get('q') || '';

    // If there's no search input, don't render header or tabs
    if (!query.trim()) return null;

    // Derive current tab from the path: /home/search/<tab>
    const segments = pathname.split('/');
    const currentTab = segments[segments.length - 1] || 'lists';

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
                    defaultActiveTab={tabsForNav.some(tab => tab.id === currentTab) ? currentTab : 'lists'}
                    renderContent={false}
                    withRoutes={false}
                    onTabChange={(tabId) => {
                        router.push(`/home/search/${tabId}?q=${encodeURIComponent(query)}`);
                    }}
                />
            </div>
        </>
    );
}
