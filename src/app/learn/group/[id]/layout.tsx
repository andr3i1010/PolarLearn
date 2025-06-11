// filepath: src/app/learn/group/[id]/layout.tsx
import GroupHeaderTabs from "@/components/GroupHeaderTabs";
import type { TabItem } from "@/components/Tabs";
import { ReactNode } from "react";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { prisma } from "@/utils/prisma";

interface GroupLayoutProps {
    children: ReactNode;
    params: { id: string; tab?: string };
}

export default async function GroupLayout({ children, params }: GroupLayoutProps) {
    const { id, tab } = params;
    const session = await getUserFromSession(
        (await cookies()).get('polarlearn.session-id')?.value as string
    );
    const currentUser = session;
    const groupData = await prisma.group.findFirst({ where: { groupId: id } });
    const members = groupData?.members as string[] || [];
    const isCreator = groupData?.creator === currentUser?.id || groupData?.creator === currentUser?.name;
    const isAdmin = Array.isArray(groupData?.admins) && currentUser ?
        groupData.admins.includes(currentUser.id) : false;
    const isMember = members.includes(currentUser?.id || '') || members.includes(currentUser?.name || '') || isCreator;

    const isPlatformAdmin = session?.role === 'admin';
    const tabs: TabItem[] = [
        { id: 'lists', label: 'Lijsten', content: <></> },
        { id: 'members', label: 'Leden', content: <></> },
        ...(isAdmin || isCreator || isPlatformAdmin
            ? [{ id: 'settings', label: 'Instellingen', content: <></> }]
            : []),
    ];

    return (
        <>
            {/* header and tabs managed by client component */}
            <GroupHeaderTabs
                tabs={tabs}
                baseRoute={`/learn/group/${id}`}
                groupName={groupData?.name || ''}
                groupDescription={groupData?.description || ''}
                requiresApproval={groupData?.requiresApproval ?? undefined}
                isMember={isMember}
                isCreator={isCreator}
                isAdmin={isAdmin}
                sessionRole={session?.role ?? undefined}
                groupId={id}
            />

            {/* content section */}
            <div>{children}</div>
        </>
    );
}
