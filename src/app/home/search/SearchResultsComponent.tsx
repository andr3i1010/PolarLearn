import { prisma } from "@/utils/prisma";
import Tabs, { TabItem } from "@/components/Tabs";
import Link from "next/link";
import Image from "next/image";
import CreatorLink from "@/components/links/CreatorLink";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { PencilIcon, Search } from "lucide-react";
import DeleteListButton from "@/components/learning/DeleteListButton";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import Jdenticon from "@/components/Jdenticon";
import { unstable_noStore as noStore } from 'next/cache'; // Ensure this is imported

// Import subject icons
import nsk_img from '@/app/img/nask.svg';
import math_img from '@/app/img/math.svg';
import eng_img from '@/app/img/english.svg';
import fr_img from '@/app/img/baguette.svg';
import de_img from '@/app/img/pretzel.svg';
import nl_img from '@/app/img/nl.svg';
import ak_img from '@/app/img/geography.svg';
import gs_img from '@/app/img/history.svg';
import bi_img from '@/app/img/bio.svg';

// Define subject icon and label maps
const subjectIconMap: Record<string, any> = {
    WI: math_img, NSK: nsk_img, NE: nl_img, EN: eng_img, FR: fr_img,
    DE: de_img, AK: ak_img, GS: gs_img, BI: bi_img,
};
const subjectLabelMap: Record<string, string> = {
    AK: "Aardrijkskunde", BI: "Biologie", DE: "Duits", EN: "Engels", FR: "Frans",
    GS: "Geschiedenis", NA: "Natuurkunde", NSK: "NaSk", NE: "Nederlands",
    SK: "Scheikunde", WI: "Wiskunde",
};

// Define helper functions
const getSubjectIcon = (subjectCode: string) => subjectIconMap[subjectCode] || null;
const getSubjectName = (subjectCode: string) => subjectLabelMap[subjectCode] || subjectCode;

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

    // Fetch lists
    const lists = await prisma.practice.findMany({
        where: {
            published: true,
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { subject: { contains: query, mode: 'insensitive' } },
                { creator: { contains: query, mode: 'insensitive' } },
            ],
        },
        select: { list_id: true, name: true, subject: true, creator: true, data: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    // Fetch forum posts
    const forumPosts = await prisma.forum.findMany({
        where: {
            type: "thread",
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
                { subject: { contains: query, mode: 'insensitive' } },
                { creator: { contains: query, mode: 'insensitive' } },
            ],
        },
        select: { post_id: true, title: true, subject: true, creator: true, createdAt: true, content: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    // Fetch user info for forum posts
    const creatorIds = [...new Set(forumPosts.map(post => post.creator))];
    const users = await prisma.user.findMany({
        where: { OR: [{ id: { in: creatorIds } }, { name: { in: creatorIds } }] },
        select: { id: true, name: true, image: true },
    });
    type UserInfo = { id: string; name: string | null; image: string | null; };
    const userMapById = users.reduce((acc: Record<string, UserInfo>, user: UserInfo) => {
        acc[user.id] = user; return acc;
    }, {} as Record<string, UserInfo>);
    const userMapByName = users.reduce((acc: Record<string, UserInfo>, user: UserInfo) => {
        if (user.name) acc[user.name] = user; return acc;
    }, {} as Record<string, UserInfo>);

    // Define tabs array using fetched data
    const tabs: TabItem[] = [
        {
            id: 'lists',
            label: `Lijsten (${lists.length})`,
            content: (
                // ... JSX for lists tab content ...
                <div className="mt-4 space-y-4">
                    {lists.length > 0 ? (
                        lists.map((list) => (
                            <div key={list.list_id} className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                                {/* ... Link, Icon, Name, Word count, CreatorLink, Buttons ... */}
                                <Link href={`/learn/viewlist/${list.list_id}`} className="flex-1 flex items-center">
                                    <div className="flex items-center">
                                        {list.subject && (
                                            <Image
                                                src={getSubjectIcon(list.subject) || ""}
                                                alt={`${getSubjectName(list.subject)} icon`}
                                                width={24}
                                                height={24}
                                                className="mr-2"
                                            />
                                        )}
                                        <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                                            {list.name}
                                        </span>
                                    </div>
                                    <div className="flex-grow"></div>
                                    <div className="flex items-center pr-2 text-sm text-neutral-400">
                                        {Array.isArray(list.data) && list.data.length === 1
                                            ? "1 woord"
                                            : `${Array.isArray(list.data) ? list.data.length : 0} woorden`}
                                    </div>
                                </Link>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                                    <CreatorLink creator={list.creator} />
                                </div>
                                {list.creator === currentUserName && (
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/learn/editlist/${list.list_id}`}
                                            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                                            title="Lijst bewerken"
                                        >
                                            <PencilIcon className="h-5 w-5 text-white" />
                                        </Link>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                                            <DeleteListButton
                                                listId={list.list_id}
                                                isCreator={true}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-neutral-400 py-8">Geen lijsten gevonden voor "{query}".</div>
                    )}
                </div>
            ),
        },
        {
            id: 'forum',
            label: `Forum (${forumPosts.length})`,
            content: (
                // ... JSX for forum tab content ...
                <div className="mt-4 space-y-4">
                    {forumPosts.length > 0 ? (
                        forumPosts.map((post) => {
                            const creatorId = typeof post.creator === 'string' ? post.creator : String(post.creator);
                            const user = userMapById[creatorId] || userMapByName[creatorId];
                            const subjectIcon = getSubjectIcon(post.subject);
                            const subjectLabel = getSubjectName(post.subject);
                            const relativeTime = formatRelativeTime(post.createdAt);
                            return (
                                <Link key={post.post_id} href={`/home/forum/${post.post_id}`} className="block">
                                    <div className="border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all flex items-start cursor-pointer mx-4 rounded-lg">
                                        {/* ... Avatar, Post details ... */}
                                        <div className="mr-4 flex-shrink-0 mt-1">
                                            {user?.image ? (
                                                <Image src={user.image} alt={`Avatar van ${user.name}`} width={40} height={40} className="rounded-full" />
                                            ) : (
                                                <Jdenticon value={user?.name || post.creator} size={40} />
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <div className="text-xs text-gray-400 mb-1 flex items-center">
                                                {subjectIcon && <Image src={subjectIcon} alt={subjectLabel} width={16} height={16} className="mr-1" />}
                                                <span>{subjectLabel}</span>
                                                <span className="mx-1.5">•</span>
                                                <span className="text-gray-500">{relativeTime}</span>
                                                <span className="mx-1.5">•</span>
                                                <span className="text-gray-500">Door: {user?.name || post.creator}</span>
                                            </div>
                                            <h3 className="font-medium text-lg mb-1">{post.title}</h3>
                                            <p className="text-sm text-gray-300 line-clamp-2">
                                                {post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="text-center text-neutral-400 py-8">Geen forum posts gevonden voor "{query}".</div>
                    )}
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

