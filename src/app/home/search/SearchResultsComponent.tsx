import { prisma } from "@/utils/prisma";
import Tabs, { TabItem } from "@/components/Tabs";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { Search } from "lucide-react";
import { unstable_noStore as noStore } from 'next/cache';
import SearchListsTab from "./SearchListsTab";
import SearchForumTab from "./SearchForumTab";
import SearchGroupsTab from "./SearchGroupsTab";
import SearchSummaryTab from "./SearchSummaryTab";

// Update props to accept the full objects (make params optional)
interface SearchResultsProps {
    searchParams: { q?: string };
    params?: { tab?: string }; // params might be undefined if called from base page
}

export default async function SearchResultsComponent({ searchParams, params }: SearchResultsProps) {
    noStore(); // Ensure this is called here

    // Get current user FIRST
    const currentUser = await getUserFromSession(
        (await cookies()).get("polarlearn.session-id")?.value as string
    );
    const currentUserName = currentUser?.name;
    const currentUserRole = currentUser?.role;

    // Await the props objects before accessing properties, as per error message
    const awaitedSearchParams = await searchParams;
    const awaitedParams = await params; // Await even if optional

    // NOW extract query and selectedTab from the awaited objects
    const query = awaitedSearchParams?.q ?? "";
    // Default to 'lists' if awaitedParams or awaitedParams.tab is undefined
    const selectedTab = awaitedParams?.tab ?? 'lists';

    // Add the empty query check HERE
    if (!query) {
        return (
            <div className="pt-10 flex flex-col items-center justify-center text-center text-neutral-400">
                <Search size={64} className="mb-4" />
                <h1 className="text-2xl font-bold mb-2">Begin met zoeken</h1>
                <p>Voer een zoekterm in de balk hierboven in om lijsten en forum posts te vinden.</p>
            </div>
        );
    }

    // Escape regex special characters in the query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Initial fetch of lists (first page)
    const lists = await prisma.practice.findMany({
        where: {
            published: true,
            mode: "list",
            OR: [
                { name: { contains: escapedQuery, mode: 'insensitive' } },
                { subject: { contains: escapedQuery, mode: 'insensitive' } },
                { creator: { contains: escapedQuery, mode: 'insensitive' } },
            ],
        },
        select: { list_id: true, name: true, subject: true, creator: true, data: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    const listsCount = await prisma.practice.count({
        where: {
            published: true,
            mode: "list",
            OR: [
                { name: { contains: escapedQuery, mode: 'insensitive' } },
                { subject: { contains: escapedQuery, mode: 'insensitive' } },
                { creator: { contains: escapedQuery, mode: 'insensitive' } },
            ],
        },
    });

    const summaries = await prisma.practice.findMany({
        where: {
            published: true,
            mode: "summary",
            OR: [
                { name: { contains: escapedQuery, mode: 'insensitive' } },
                { subject: { contains: escapedQuery, mode: 'insensitive' } },
                { creator: { contains: escapedQuery, mode: 'insensitive' } },
            ],
        },
    })

    const summariesCount = await prisma.practice.count({
        where: {
            published: true,
            mode: "summary",
            OR: [
                { name: { contains: escapedQuery, mode: 'insensitive' } },
                { subject: { contains: escapedQuery, mode: 'insensitive' } },
                { creator: { contains: escapedQuery, mode: 'insensitive' } },
            ],
        },
    });

    // Initial fetch of forum posts (first page)
    const forumPosts = await prisma.forum.findMany({
        where: {
            type: "thread",
            OR: [
                { title: { contains: escapedQuery, mode: 'insensitive' } },
                { content: { contains: escapedQuery, mode: 'insensitive' } },
                { subject: { contains: escapedQuery, mode: 'insensitive' } },
                { creator: { contains: escapedQuery, mode: 'insensitive' } },
            ],
        },
        select: { post_id: true, title: true, subject: true, creator: true, createdAt: true, content: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    const forumCount = await prisma.forum.count({
        where: {
            type: "thread",
            OR: [
                { title: { contains: escapedQuery, mode: 'insensitive' } },
                { content: { contains: escapedQuery, mode: 'insensitive' } },
                { subject: { contains: escapedQuery, mode: 'insensitive' } },
                { creator: { contains: escapedQuery, mode: 'insensitive' } },
            ],
        },
    });

    // Initial fetch of groups (first page)
    const groups = await prisma.group.findMany({
        where: {
            OR: [
                { name: { contains: escapedQuery, mode: 'insensitive' } },
                { description: { contains: escapedQuery, mode: 'insensitive' } },
            ],
        },
        select: {
            groupId: true,
            name: true,
            description: true,
            members: true,
            listsAdded: true,
            creator: true,
            requiresApproval: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
    });

    const groupsCount = await prisma.group.count({
        where: {
            OR: [
                { name: { contains: escapedQuery, mode: 'insensitive' } },
                { description: { contains: escapedQuery, mode: 'insensitive' } },
            ],
        },
    });

    // Extract ALL creator IDs from lists, forum posts, and groups
    const creatorIds = [
        ...new Set([
            ...lists.map((list: { creator: any; }) => list.creator),
            ...forumPosts.map((post: { creator: any; }) => post.creator),
            ...groups.map((group: { creator: any; }) => group.creator)
        ])
    ];

    // Fetch user info for ALL creators in a single query
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { id: { in: creatorIds } },
                { name: { in: creatorIds } } // For backward compatibility
            ]
        },
        select: { id: true, name: true, image: true },
    });

    // Create lookup maps by both ID and name for efficient access
    const userMapById = users.reduce((acc: Record<string, any>, user: { id: string | number; }) => {
        acc[user.id] = user;
        return acc;
    }, {});

    const userMapByName = users.reduce((acc: Record<string, any>, user: { name: string | null; id: string; image: string | null; }) => {
        if (user.name) acc[user.name] = user;
        return acc;
    }, {});

    // Define tabs array using fetched data
    const tabs: TabItem[] = [
        {
            id: 'lists',
            label: `Lijsten (${listsCount})`,
            content: (
                <div className="mt-4">
                    <SearchListsTab
                        query={query}
                        initialLists={lists}
                        initialTotal={listsCount}
                        initialUserMapById={userMapById}
                        initialUserMapByName={userMapByName}
                        currentUserName={currentUserName ?? null}
                        currentUserRole={currentUserRole ?? null}
                    />
                </div>
            ),
        },
        {
            id: "summaries",
            label: `Samenvattingen (${summariesCount})`,
            content: (
                <div className="mt-4">
                    <SearchSummaryTab
                        query={query}
                        initialSummaries={summaries}
                        initialTotal={summaries.length} // Use length for summaries
                        initialUserMapById={userMapById}
                        initialUserMapByName={userMapByName}
                        currentUserName={currentUserName ?? null}
                        currentUserRole={currentUserRole ?? null}
                    />
                </div>
            )
        },
        {
            id: 'forum',
            label: `Forum (${forumCount})`,
            content: (
                <div className="mt-4">
                    <SearchForumTab
                        query={query}
                        initialPosts={forumPosts}
                        initialTotal={forumCount}
                        initialUserMapById={userMapById}
                        initialUserMapByName={userMapByName}
                    />
                </div>
            ),
        },
        // Add new tab for groups
        {
            id: 'groups',
            label: `Groepen (${groupsCount})`,
            content: (
                <div className="mt-4">
                    <SearchGroupsTab
                        query={query}
                        initialGroups={groups}
                        initialTotal={groupsCount}
                        initialUserMapById={userMapById}
                        initialUserMapByName={userMapByName}
                    />
                </div>
            ),
        },
    ];

    // Base route for tabs (path only)
    const baseRoute = `/home/search`;

    // Render the results including Tabs
    return (
        <>
            <h1 className="text-2xl font-bold px-6 mb-4">
                Zoekresultaten voor: <span className="text-sky-400">{query}</span>
            </h1>
            <div className="pl-4">
                <Tabs
                    tabs={tabs}
                    defaultActiveTab={selectedTab} // Use extracted value
                    withRoutes={true}
                    baseRoute={baseRoute}
                />
            </div>
            <div className="h-4" />
        </>
    );
}

