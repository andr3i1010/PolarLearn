"use client";

import Tabs, { TabItem } from "@/components/Tabs";
import Image from "next/image";
import Jdenticon from "@/components/Jdenticon";

interface ViewUserTabsWrapperProps {
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
    selectedTab: string;
    userId: string;
}

export default function ViewUserTabsWrapper({
    user,
    selectedTab,
    userId
}: ViewUserTabsWrapperProps) {
    const tabsForNav: TabItem[] = [
        {
            id: "lists",
            label: "Gemaakte lijsten",
            content: <></>, // Dummy content, as renderContent will be false
        },
        {
            id: "summaries",
            label: "Samenvattingen",
            content: <></>,
        },
        {
            id: "groups",
            label: "Groepen",
            content: <></>,
        },
        {
            id: "achievements",
            label: "Prestaties",
            content: <></>,
        },
    ];

    return (
        <>
            <div className="space-x-5 flex flex-row items-center pl-2">
                {user?.image ? (
                    <Image
                        src={user.image}
                        alt={`${user.name}'s Avatar`}
                        width={100}
                        height={100}
                        className="rounded-full"
                    />
                ) : (
                    <Jdenticon
                        value={user?.name || "default"}
                        size={100}
                        className="rounded-full"
                    />
                )}
                <h1 className="text-2xl font-bold">{user?.name}</h1>
            </div>
            <div className="h-4" />
            <div className="pl-4">
                <Tabs
                    tabs={tabsForNav}
                    defaultActiveTab={selectedTab || "lists"}
                    withRoutes={true}
                    baseRoute={`/home/viewuser/${userId}`}
                    renderContent={false} // Key: This instance won't render content directly
                />
            </div>
        </>
    );
}
