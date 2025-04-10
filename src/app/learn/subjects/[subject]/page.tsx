import { prisma } from "@/utils/prisma";
import Tabs, { TabItem } from "@/components/Tabs";
import Image from "next/image";
import Link from "next/link";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { PencilIcon } from "lucide-react";
import DeleteListButton from "@/components/learning/DeleteListButton";
import CreatorLink from "@/components/links/CreatorLink";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

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
import construction from '@/app/img/construction.gif';
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";

// Function to get the appropriate icon for each subject
const getSubjectIcon = (subjectCode: string) => {
    switch (subjectCode) {
        case "NL": return nl_img;
        case "FR": return fr_img;
        case "EN": return eng_img;
        case "DE": return de_img;
        case "WI": return math_img;
        case "NSK": return nsk_img;
        case "AK": return ak_img;
        case "GS": return gs_img;
        case "BI": return bi_img;
        default: return null;
    }
};

// Function to get the full subject name
const getSubjectName = (subjectCode: string) => {
    switch (subjectCode) {
        case "NL": return "Nederlands";
        case "FR": return "Frans";
        case "EN": return "Engels";
        case "DE": return "Duits";
        case "WI": return "Wiskunde";
        case "NSK": return "NaSk";
        case "AK": return "Aardrijkskunde";
        case "GS": return "Geschiedenis";
        case "BI": return "Biologie";
        default: return subjectCode;
    }
};

export default async function Page({ params }: { params: Promise<{ subject: string; tab?: string }> }) {
    // Await the Promise to get the actual params
    const { subject, tab } = await params;

    // Get current user for checking ownership
    const currentUser = await getUserFromSession(
        (await cookies()).get("polarlearn.session-id")?.value as string
    );
    const currentUserName = currentUser?.name;

    // Get subject name and icon
    const subjectName = getSubjectName(subject);
    const subjectIcon = getSubjectIcon(subject);

    // Fetch published lists for this subject
    const lists = await prisma.practice.findMany({
        where: {
            subject: subject,
            published: true,
        },
        select: {
            list_id: true,
            name: true,
            creator: true,
            createdAt: true,
            data: true,
            subject: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Get user's recent lists
    const user = currentUser;
    const account = user ? await prisma.user.findUnique({
        where: { id: user.id }
    }) : null;

    const listData = account?.list_data as any || {};
    const recentListIds = Array.isArray(listData.recent_lists)
        ? listData.recent_lists.filter(Boolean)
        : [];

    // Fetch user's practiced lists for this subject
    const practicedLists = recentListIds.length > 0
        ? await prisma.practice.findMany({
            where: {
                list_id: { in: recentListIds },
                subject: subject,
                published: true,
            },
            select: {
                list_id: true,
                name: true,
                creator: true,
                createdAt: true,
                data: true,
                subject: true,
            },
        })
        : [];

    // Create a map for quick lookup of list positions in recentListIds
    const recentListIdPositions = Object.fromEntries(
        recentListIds.map((id: any, index: any) => [id, index])
    );

    // Sort practiced lists according to when they were practiced (most recent first)
    const sortedPracticedLists = practicedLists.sort((a, b) => {
        return recentListIdPositions[a.list_id] - recentListIdPositions[b.list_id];
    });

    // Find lists created by current user for this subject
    const myLists = currentUserName ? lists.filter(list => list.creator === currentUserName) : [];

    // Fetch forum posts for this subject
    const forumPosts = await prisma.forum.findMany({
        where: {
            subject: subject,
            type: "thread"
        },
        orderBy: {
            createdAt: 'desc'
        },
        select: {
            post_id: true,
            title: true,
            content: true,
            creator: true,
            createdAt: true,
            votes: true
        },
        take: 10
    }) || [];

    // Get reply counts for forum posts
    const replyCountMap: Record<string, number> = {};

    if (forumPosts.length > 0) {
        const postIds = forumPosts.map(post => post.post_id);
        const replyCounts = await prisma.forum.groupBy({
            by: ['post_id'],
            where: {
                post_id: { in: postIds },
                type: "reply"
            },
            _count: {
                post_id: true,
            }
        });

        replyCounts.forEach(item => {
            replyCountMap[item.post_id] = item._count.post_id;
        });
    }

    // Get user names for creators
    const creatorIds = forumPosts.map(post => post.creator);
    const creators = creatorIds.length > 0 ?
        await prisma.user.findMany({
            where: { id: { in: creatorIds } },
            select: { id: true, name: true }
        }) : [];

    // Create a map of user IDs to names
    const creatorNameMap: Record<string, string> = {};
    creators.forEach(user => {
        creatorNameMap[user.id] = user.name as string;
    });

    // Define tabs for this page
    const tabs: TabItem[] = [
        {
            id: "practiced-lists",
            label: "Geoefende Lijsten",
            content: (
                <div className="mt-4">
                    {sortedPracticedLists.length > 0 ? (
                        <div className="space-y-4">
                            {sortedPracticedLists.map((list) => (
                                <div key={list.list_id}>
                                    <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                                        <Link href={`/learn/viewlist/${list.list_id}`} className="flex-1 flex items-center">
                                            <div className="flex items-center">
                                                {subjectIcon && (
                                                    <Image
                                                        src={subjectIcon}
                                                        alt={`${subjectName} icon`}
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
                                            <div className="flex items-center pr-2">
                                                {Array.isArray(list.data) && list.data.length === 1
                                                    ? "1 woord"
                                                    : `${Array.isArray(list.data) ? list.data.length : 0} woorden`}
                                            </div>
                                        </Link>

                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                                            <CreatorLink creator={list.creator} />
                                        </div>

                                        {/* Action buttons for list owner */}
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
                                                        isCreator={list.creator === currentUserName}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
                            {currentUserName
                                ? `Je hebt nog geen ${subjectName} lijsten geoefend`
                                : 'Log in om je geoefende lijsten te zien'}
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: "my-lists",
            label: "Mijn Lijsten",
            content: (
                <div className="mt-4">
                    {myLists.length > 0 ? (
                        <div className="space-y-4">
                            {myLists.map((list) => (
                                <div key={list.list_id}>
                                    <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                                        <Link href={`/learn/viewlist/${list.list_id}`} className="flex-1 flex items-center">
                                            <div className="flex items-center">
                                                {subjectIcon && (
                                                    <Image
                                                        src={subjectIcon}
                                                        alt={`${subjectName} icon`}
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
                                            <div className="flex items-center pr-2">
                                                {Array.isArray(list.data) && list.data.length === 1
                                                    ? "1 woord"
                                                    : `${Array.isArray(list.data) ? list.data.length : 0} woorden`}
                                            </div>
                                        </Link>

                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                                            <CreatorLink creator={list.creator} />
                                        </div>

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
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
                            {currentUserName
                                ? `Je hebt nog geen ${subjectName} lijsten gemaakt`
                                : 'Log in om je eigen lijsten te zien'}
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: "forum",
            label: "Forum",
            content: (
                <div className="mt-4">
                    {forumPosts.length > 0 ? (
                        <div className="space-y-4">
                            {forumPosts.map((post) => (
                                <Link key={post.post_id} href={`/home/forum/${post.post_id}`}>
                                    <div className="tile bg-neutral-800 hover:bg-neutral-700 transition-colors text-white py-3 px-6 mx-4 rounded-lg">
                                        <div className="flex items-center mb-1">
                                            <h3 className="text-lg font-bold">{post.title}</h3>
                                            <div className="flex-grow"></div>
                                            <span className="text-sm text-gray-400">
                                                {formatRelativeTime(new Date(post.createdAt))}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300 line-clamp-2">
                                            {post.content}
                                        </p>
                                        <div className="flex items-center mt-2 text-sm text-gray-400">
                                            <span>Door: {creatorNameMap[post.creator as string] || 'Onbekend'}</span>
                                            <span className="mx-2">•</span>
                                            <span>{replyCountMap[String(post.post_id)] || 0} antwoorden</span>
                                            <span className="mx-2">•</span>
                                            <span>{post.votes} stemmen</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="tile bg-neutral-800 text-neutral-400 text-xl font-bold py-2 px-4 mx-4 rounded-lg h-20 text-center place-items-center grid">
                            Er zijn nog geen forumvragen voor {subjectName}
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: "statistics",
            label: "Statistieken",
            content: (
                <div className="mt-4 flex flex-col items-center justify-center">
                    <Image src={construction} alt="under construction!" width={500} height={100} />
                    <p className="text-lg mt-4">Statistieken voor {subjectName} komen binnenkort!</p>
                </div>
            ),
        },
    ];

    return (
        <div className="pt-4">
            <div className="px-6 flex items-center mb-6">
                <div className="flex items-center">
                    {subjectIcon && (
                        <div className="mr-4">
                            <Image src={subjectIcon} alt={`${subjectName} icon`} width={48} height={48} />
                        </div>
                    )}
                    <h1 className="text-3xl font-bold">{subjectName}</h1>
                </div>
            </div>

            <div className="pl-4">
                <Tabs
                    tabs={tabs}
                    defaultActiveTab={tab || "practiced-lists"}
                    withRoutes={true}
                    baseRoute={`/learn/subjects/${subject}`}
                />
            </div>
            <div className="h-4" />
        </div>
    );
}