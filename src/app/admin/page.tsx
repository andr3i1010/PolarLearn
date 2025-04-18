export const dynamic = "force-dynamic";

import Tabs, { TabItem } from "@/components/Tabs";
import { prisma } from "@/utils/prisma";
import Image from "next/image";
import Link from "next/link";
import Jdenticon from "@/components/Jdenticon";
import { getUserFromSession } from "@/utils/auth/auth";
import Button1 from "@/components/button/Button1";
import DeleteListButton from "@/components/learning/DeleteListButton";
import BanButton from "./banButton";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// Import the subject icons
import nsk_img from "@/app/img/nask.svg";
import math_img from "@/app/img/math.svg";
import eng_img from "@/app/img/english.svg";
import fr_img from "@/app/img/baguette.svg";
import de_img from "@/app/img/pretzel.svg";
import nl_img from "@/app/img/nl.svg";
import ak_img from "@/app/img/geography.svg";
import gs_img from "@/app/img/history.svg";
import bi_img from "@/app/img/bio.svg";
import { cookies } from "next/headers";
import MarkdownRenderer from "@/components/md";
import { use } from "react";
import { date } from "zod";

// Create a map for subject icons
// WAAROM WAS DE NEDERLANDS APKORTING ANDERS!!!!! 
const subjectIconMap: Record<string, any> = {
    WI: math_img,
    NSK: nsk_img,
    NL: nl_img,
    EN: eng_img,
    FR: fr_img,
    DE: de_img, // Use DE for Duits consistently
    AK: ak_img,
    GS: gs_img,
    BI: bi_img,
};

export default async function AdminPage({
    searchParams,
    params,
}: {
    searchParams: Promise<{ page?: string }>;
    params?: { tab?: string[] };
}) {

    const defaultActiveTab =
        params && params.tab && params.tab.length > 0 ? params.tab[0] : "questions";

    const session = await getUserFromSession(
        (await cookies()).get("polarlearn.session-id")!.value
    );
    const user = await prisma.user.findFirst({
        where: {
            name: session!.name,
        },
    });


    if (session?.role != "admin") {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-4xl font-extrabold mb-4">Je hebt geen toegang tot deze pagina</h1>
                <Link href="/">
                    <Button1 text="Terug naar home" />
                </Link>
            </div>
        );

    }
    // const page = parseInt(paramsSearch.page as string) || 1;
    const page = 1;

    const take = 20;
    const skip = (page - 1) * take;

    // Fetch current userlist and total count concurrently
    const [userslist, totalUsers] = await Promise.all([
        prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.user.count(),
    ]);

    // Fetch lists of questions and answers and count total
    const [listslist, listTotal] = await Promise.all([
        prisma.practice.findMany({
            orderBy: {
                createdAt: "desc", // Sort by newest first
            },
        }),
        prisma.practice.count(),
    ]);

    // Get the parent thread information for context

    const totalUserPages = Math.ceil(totalUsers / take);
    const totalListPages = Math.ceil(listTotal / take);

    // Also update the currentUsername variable to include both user ID and name for comparison
    const currentUsername = session?.name;
    const currentUserId = session?.id;

    // Get unique creator IDs from all lists
    const creatorIds = [...new Set([...listslist]
        .map(post => post.creator)
    )];

    // Also try to fetch users by name in case creator contains usernames
    const users = await prisma.user.findMany({
        where: {
            OR: [{ id: { in: creatorIds } }, { name: { in: creatorIds } }],
        },
        select: {
            id: true,
            name: true,
            image: true,
        },
    });

    // Define a type for user objects
    type UserInfo = {
        id: string;
        name: string | null;
        image: string | null;
    };

    // Create maps for both ID and name lookups
    const userMapById = users.reduce((acc: Record<string, UserInfo>, user: UserInfo) => {
        acc[user.id] = user;
        return acc;
    }, {} as Record<string, UserInfo>);

    const userMapByName = users.reduce((acc: Record<string, UserInfo>, user: UserInfo) => {
        if (user.name) acc[user.name] = user;
        return acc;
    }, {} as Record<string, UserInfo>);

    // Function to render user list
    const renderUserList = (users: any[], totalUserPages: number, currentPage: number, tabId: string) => (
        <>
            <div className="border w-33/34 border-neutral-700 rounded-md overflow-hidden">
                {users.length > 0 ? (
                    users.map((user) => (
                        <div key={user.id} className="relative border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all">
                            <Link href={`/home/viewuser/${user.name}`} className="inline-block w-9/11 ">
                                <div
                                    className={` flex items-center cursor-pointer`}
                                >
                                    <div className="mr-4 flex-shrink-0">
                                        {user?.image ? (
                                            <Image
                                                src={user.image}
                                                alt={`de profielfoto van ${user.name}`}
                                                width={40}
                                                height={40}
                                                className="rounded-full" />
                                        ) : (
                                            <Jdenticon
                                                value={user?.name}
                                                size={40} />
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <h3 className="font-medium text-lg">
                                            {user.name}
                                            {user.id === currentUserId ? " (jij)" : ""}
                                        </h3>
                                        <span>
                                            {user.forumAllowed ? "" : " reden: " + user.forumBanReason}
                                            {user.loginAllowed ? "" : " reden: " + user.banReason}

                                        </span>
                                    </div>

                                </div>
                            </Link>
                            <div className="inline-block w-1/11 text-right">
                                {!user.forumAllowed ? <BanButton userId={user.id} text="unban van forum" platform={false} unban={true} /> : <BanButton userId={user.id} text="ban van forum" platform={false} unban={false} />}
                            </div>
                            <div className="inline-block w-1/11 text-right">
                                {!user.forumAllowed ? <BanButton userId={user.id} text="unban van platform" platform={true} unban={true} /> : <BanButton userId={user.id} text="ban van platform" platform={true} unban={false} />}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-400">
                        {tabId === "my-questions"
                            ? "Je hebt nog geen vragen gesteld."
                            : "Je hebt nog geen antwoorden gegeven."}
                    </div>
                )}
            </div>

            {totalUserPages > 1 && (
                <div className="mt-4 flex justify-center">
                    <Pagination>
                        <PaginationPrevious>
                            {currentPage > 1 ? (
                                <Link href={`/home/forum${tabId !== "questions" ? `/${tabId}` : ""}?page=${currentPage - 1}`}>Vorige</Link>
                            ) : (
                                <span className="text-gray-400">Vorige</span>
                            )}
                        </PaginationPrevious>
                        {/* Render page numbers */}
                        <PaginationContent>
                            {Array.from({ length: totalUserPages }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <PaginationItem key={pageNum}>
                                        <PaginationLink
                                            href={`/home/forum${tabId !== "questions" ? `/${tabId}` : ""}?page=${pageNum}`}
                                            isActive={pageNum === currentPage}
                                        >
                                            {pageNum}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}
                        </PaginationContent>
                        <PaginationNext>
                            {currentPage === totalUserPages ? (
                                <span className="text-gray-400">Volgende</span>
                            ) : (
                                <Link href={`/home/forum${tabId !== "questions" ? `/${tabId}` : ""}?page=${currentPage + 1}`}>Volgende</Link>
                            )}
                        </PaginationNext>
                    </Pagination>
                </div>
            )}
        </>
    );
    const renderListsList = (lists: any[], totalListPages: number, currentPage: number, tabId: string) => (
        <>
            <div className="border w-33/34 border-neutral-700 rounded-md overflow-hidden">
                {lists.length > 0 ? (
                    lists.map((list) => (
                        <div key={list.list_id} className="relative border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all">
                            <Link href={`/learn/viewlist/${list.list_id}`} className="inline-block w-9/10 ">
                                <div
                                    className={` flex items-center cursor-pointer`}
                                >
                                    <div className="mr-4 flex-shrink-0">
                                        {list?.subject ? (
                                            <Image
                                                src={subjectIconMap[list.subject] || "/default-icon.svg"}
                                                alt={`${list.subject} icon`}
                                                width={40}
                                                height={40}
                                                className="rounded-full" />
                                        ) : ""}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <h3 className="font-medium text-lg">
                                            {list.name}
                                        </h3>
                                        <span>
                                            door {list.creator}
                                        </span>
                                    </div>

                                </div>
                            </Link>
                            <div className="inline-block w-1/10 ">
                                <DeleteListButton
                                    listId={list.list_id}
                                    isCreator={true}
                                    customText="Verwijder"
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-400">
                        {tabId === "my-questions"
                            ? "Je hebt nog geen vragen gesteld."
                            : "Je hebt nog geen antwoorden gegeven."}
                    </div>
                )}
            </div>

            {totalUserPages > 1 && (
                <div className="mt-4 flex justify-center">
                    <Pagination>
                        <PaginationPrevious>
                            {currentPage > 1 ? (
                                <Link href={`/home/forum${tabId !== "questions" ? `/${tabId}` : ""}?page=${currentPage - 1}`}>Vorige</Link>
                            ) : (
                                <span className="text-gray-400">Vorige</span>
                            )}
                        </PaginationPrevious>
                        {/* Render page numbers */}
                        <PaginationContent>
                            {Array.from({ length: totalUserPages }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <PaginationItem key={pageNum}>
                                        <PaginationLink
                                            href={`/home/forum${tabId !== "questions" ? `/${tabId}` : ""}?page=${pageNum}`}
                                            isActive={pageNum === currentPage}
                                        >
                                            {pageNum}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}
                        </PaginationContent>
                        <PaginationNext>
                            {currentPage === totalUserPages ? (
                                <span className="text-gray-400">Volgende</span>
                            ) : (
                                <Link href={`/home/forum${tabId !== "questions" ? `/${tabId}` : ""}?page=${currentPage + 1}`}>Volgende</Link>
                            )}
                        </PaginationNext>
                    </Pagination>
                </div>
            )}
        </>
    );

    const tabs: TabItem[] = [
        {
            id: "gebruikers",
            label: "Gebruikers",
            content: renderUserList(userslist, totalUserPages, page, "gebruikers"),
        },
        {
            id: "lijsten",
            label: "Lijsten",
            content: renderListsList(listslist, listTotal, page, "lijsten"),
        }
    ];
    let banned = false;
    if (!user!.forumAllowed || !user!.loginAllowed) {
        banned = true;
    }

    // Determine the base route dynamically
    // This extracts everything before the last segment which would be the tab ID
    let baseRoute = "/admin";

    // If we have a tab in the params, we're already at a subroute
    if (params?.tab && params.tab.length > 0) {
        // We're in a route like /home/forum/[tab] - the base path is everything before the tab
        baseRoute = "/admin";
    }

    return (
        <>
            <div className="py-6 pl-6">
                <div className="flex items-center">
                    <h1 className="text-4xl font-extrabold mb-4">admin</h1>
                    <div className="flex-grow"></div>
                    <div className="w-4" />
                </div>
                <Tabs
                    tabs={tabs}
                    defaultActiveTab={defaultActiveTab}
                    withRoutes={true}
                    baseRoute={baseRoute} // Use dynamically derived base route
                />
            </div>
        </>
    );
}
