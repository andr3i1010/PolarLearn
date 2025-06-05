import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import JweDecoderWrapper from "../JweDecoderWrapper";
import UsersTabContent from "../UsersTabContent";
import ListsTabContent from "../ListsTabContent";
import GroupsTabContent from "../GroupsTabContent";

// Helper to fetch initial data for tabs that need it
async function getInitialDataForTab(tabId: string, userMapById: Record<string, any>) {
    const take = 20;
    const skip = 0;

    if (tabId === "gebruikers") {
        const usersData = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take,
        });
        const usersTotal = await prisma.user.count();
        return { usersData, usersTotal };
    }
    if (tabId === "lijsten") {
        const listsData = await prisma.practice.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take,
        });
        const listsTotal = await prisma.practice.count();
        return { listsData, listsTotal, userMapById }; // Pass userMap for creator names
    }
    if (tabId === "groepen") {
        const groupsData = await prisma.group.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take,
        });
        const groupsTotal = await prisma.group.count();
        return { groupsData, groupsTotal, userMapById }; // Pass userMap if needed for group details
    }
    return {};
}

export default async function AdminTabPageByRoute({
    params: paramsPromise, // Renamed to indicate it's a Promise
}: {
    params: Promise<{ tab?: string[] }>; // Changed to Promise type
}) {
    const params = await paramsPromise; // Resolve the Promise
    const selectedTabId = params.tab?.[0] || 'gebruikers';
    const session = await getUserFromSession((await cookies()).get("polarlearn.session-id")!.value);
    const currentUserId = session?.id || null; // Ensure null if undefined

    // Fetch common data like userMapById once, if needed by multiple tabs
    // This is similar to what was in the original AdminPage
    const allCreatorIdsForLists = (await prisma.practice.findMany({ select: { creator: true } })).map(p => p.creator);
    const allUsersForMap = await prisma.user.findMany({
        where: { OR: [{ id: { in: allCreatorIdsForLists } }, { name: { in: allCreatorIdsForLists } }] },
        select: { id: true, name: true, image: true },
    });
    const userMapById = allUsersForMap.reduce((acc: Record<string, any>, user: any) => {
        acc[user.id] = user;
        return acc;
    }, {});

    const tabData = await getInitialDataForTab(selectedTabId, userMapById);

    if (selectedTabId === "gebruikers") {
        return <UsersTabContent
            initialUsersData={(tabData as any).usersData}
            initialUsersTotal={(tabData as any).usersTotal}
            currentUserId={currentUserId} // Now correctly string | null
        />;
    }
    if (selectedTabId === "lijsten") {
        return <ListsTabContent
            initialListsData={(tabData as any).listsData}
            initialListsTotal={(tabData as any).listsTotal}
            initialUserMapById={(tabData as any).userMapById}
            currentUserId={currentUserId} // Now correctly string | null
        />;
    }
    if (selectedTabId === "groepen") {
        return <GroupsTabContent
            initialGroupsData={(tabData as any).groupsData}
            initialGroupsTotal={(tabData as any).groupsTotal}
            initialUserMapById={(tabData as any).userMapById} // Pass if needed
        />;
    }
    if (selectedTabId === "jwe") {
        return <div className="mt-6"><JweDecoderWrapper /></div>;
    }

    // Fallback or error component if tabId is not recognized
    return <div>Ongeldige tab. Selecteer een tab hierboven.</div>;
}
