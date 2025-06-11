"use client";
import { usePathname } from "next/navigation";
import Tabs, { TabItem } from "@/components/Tabs";
import Jdenticon from "@/components/Jdenticon";
import JoinGroupButton from "@/components/groups/JoinGroupButton";
import LeaveGroupButton from "@/components/groups/LeaveGroupButton";
import { ReactNode } from "react";

interface GroupHeaderTabsProps {
    tabs: TabItem[];
    baseRoute: string;
    bannedOrRestrictedContent?: ReactNode;
    groupName: string;
    groupDescription: string;
    requiresApproval?: boolean;
    isMember: boolean;
    isCreator: boolean;
    isAdmin: boolean;
    sessionRole?: string;
    groupId: string;
}

export default function GroupHeaderTabs({
    tabs,
    baseRoute,
    groupName,
    groupDescription,
    requiresApproval,
    isMember,
    isCreator,
    isAdmin,
    sessionRole,
    groupId
}: GroupHeaderTabsProps) {
    const pathname = usePathname() || "";
    const segments = pathname.split('/');
    // e.g. ['', 'learn','group','<id>','<tab>']
    const segment = segments[4] || "";
    // Determine URL tab
    const urlTab = tabs.some(tab => tab.id === segment) ? segment : 'lists';
    // Only hide header on restricted pages for non-members without override
    const canBypassApproval = isCreator || isAdmin || sessionRole === 'admin';
    const isRestricted = !!requiresApproval && !isMember && !canBypassApproval;

    if (isRestricted) {
        // don't show header tabs if group restricted view
        return null;
    }

    return (
        <>
            <div className="flex flex-col p-4">
                <div className="flex items-center space-x-4">
                    <Jdenticon value={groupName || ''} size={70} />
                    <h1 className="text-4xl font-extrabold">{groupName}</h1>
                    <div className="flex-grow" />
                    {/* Join/Leave buttons */}
                    {!isMember && <JoinGroupButton groupId={groupId} requiresApproval={!!requiresApproval && !canBypassApproval} />}
                    {isMember && !isCreator && <LeaveGroupButton groupId={groupId} />}
                </div>
                <p className="mt-2">{groupDescription}</p>
            </div>
            <div className="px-6">
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
