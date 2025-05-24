import { prisma } from "@/utils/prisma";
import Image from "next/image";
import Link from "next/link";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import DeleteGroupButton from "@/components/groups/DeleteGroupButton";
import { getSubjectIcon } from "@/components/icons";
import DeleteUserButton from "./DeleteUserButton";
import ResetPasswordButton from "./ResetPasswordButton";
import SendNotificationButton from "./SendNotificationButton";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import Button1 from "@/components/button/Button1";
import AdminTabs from "./AdminTabs";

export default async function AdminPage({
    params,
    searchParams,
}: {
    params?: Promise<{ tab?: string[] }>;
    searchParams?: Promise<{ page?: string }>;
}) {
    const awaitedParams = params ? await params : undefined;
    const defaultActiveTab =
        awaitedParams?.tab && awaitedParams.tab.length > 0
            ? awaitedParams.tab[0]
            : "gebruikers";

    const session = await getUserFromSession(
        (await cookies()).get("polarlearn.session-id")!.value
    );

    if (session?.role != "admin") {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <Image
                    src={require("@/app/admin/ga_weg.png")}
                    alt="aardige man" // vind ik ook
                    width={300}
                    height={300}
                    className="mb-4"
                />

                <h1 className="text-4xl font-extrabold mb-4">ga weg</h1>

                <Link href="/">
                    <Button1 text="Terug naar home" />
                </Link>
            </div>
        );
    }

    // Fetch initial data for client component (first page only)
    const take = 20;
    const skip = 0;

    // Fetch initial data for users, lists, and groups concurrently
    const [usersData, listsData, groupsData] = await Promise.all([
        prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.practice.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.group.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
    ]);

    // Get creator IDs from lists
    const creatorIds = [...new Set([...listsData].map((post) => post.creator))];

    // Fetch users for the creator IDs
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

    // Create user map by ID
    const userMapById = users.reduce(
        (acc: Record<string, any>, user: any) => {
            acc[user.id] = user;
            return acc;
        },
        {} as Record<string, UserInfo>
    );
    // Function to render pagination
    const renderPagination = (totalPages: number, currentPage: number, tabId: string) => {
        if (totalPages <= 1) return null;

        return (
            <div className="mt-4 flex justify-center">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href={currentPage > 1 ? `/admin/${tabId}?page=${currentPage - 1}` : "#"}
                                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, i) => {
                            const pageNum = i + 1;
                            // Show limited page numbers to avoid cluttering
                            if (
                                pageNum === 1 ||
                                pageNum === totalPages ||
                                (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                            ) {
                                return (
                                    <PaginationItem key={pageNum}>
                                        <PaginationLink
                                            href={`/admin/${tabId}?page=${pageNum}`}
                                            isActive={pageNum === currentPage}
                                        >
                                            {pageNum}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            }
                            // Add ellipsis for skipped pages
                            if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                                return (
                                    <PaginationItem key={`ellipsis-${pageNum}`}>
                                        <span className="px-4">...</span>
                                    </PaginationItem>
                                );
                            }
                            return null;
                        })}

                        <PaginationItem>
                            <PaginationNext
                                href={currentPage < totalPages ? `/admin/${tabId}?page=${currentPage + 1}` : "#"}
                                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        );
    };

    // Function to render user list
    const renderUserList = (users: any[], totalPages: number, currentPage: number) => (
        <>
            <h1 className="font-extrabold text-2xl pb-4 ">{totalUsers} gebruikers in db</h1>
            <div className="border w-33/34 border-neutral-700 rounded-md overflow-hidden">
                {users.length > 0 ? (
                    users.map((user) => (
                        <div
                            key={user.id}
                            className="relative border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all"
                        >
                            <Link
                                href={`/home/viewuser/${user.name}`}
                                className="inline-block w-7/11 "
                            >
                                <div className={` flex items-center cursor-pointer`}>
                                    <div className="mr-4 flex-shrink-0">
                                        {user?.image ? (
                                            <Image
                                                src={user.image}
                                                alt={`de profielfoto van ${user.name}`}
                                                width={40}
                                                height={40}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <Jdenticon value={user?.name} size={40} />
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <h3 className="font-medium text-lg">
                                            {user.name}
                                            {user.id === currentUserId ? " (jij)" : ""}
                                            {user?.role === "admin" ? " (admin)" : ""}
                                            <span> </span>
                                            {user?.forumAllowed ? (
                                                ""
                                            ) : (
                                                <span className="text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm bg-yellow-900 text-yellow-300">
                                                    Forum banned
                                                </span>
                                            )}
                                            {user?.loginAllowed ? (
                                                ""
                                            ) : (
                                                <span className="text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm bg-red-900 text-red-300">
                                                    Banned
                                                </span>
                                            )}
                                        </h3>
                                        <h3>email: {user?.email}</h3>
                                        <span>
                                            {user.forumAllowed
                                                ? ""
                                                : ` reden: ${user.forumBanReason || "geen reden opgegeven"
                                                }`}
                                            {!user.forumAllowed && !user.loginAllowed ? ", " : ""}
                                            {!user.loginAllowed && user.forumAllowed
                                                ? " reden: "
                                                : ""}
                                            {user.loginAllowed
                                                ? ""
                                                : `${user.banReason || "geen reden opgegeven"}`}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                            {user.role !== 'admin' && (
                                <>
                                    <div className="inline-block w-1/11 text-right">
                                        {!user.forumAllowed ? (
                                            <BanButton
                                                userId={user.id}
                                                text="unban van forum"
                                                platform={false}
                                                unban={true}
                                            />
                                        ) : (
                                            <BanButton
                                                userId={user.id}
                                                text="ban van forum"
                                                platform={false}
                                                unban={false}
                                            />
                                        )}
                                    </div>
                                    <div className="inline-block w-1/11 text-right">
                                        {!user.loginAllowed ? (
                                            <BanButton
                                                userId={user.id}
                                                text="unban van platform"
                                                platform={true}
                                                unban={true}
                                            />
                                        ) : (
                                            <BanButton
                                                userId={user.id}
                                                text="ban van platform"
                                                platform={true}
                                                unban={false}
                                            />
                                        )}
                                    </div>
                                    <div className="inline-block w-1/11 text-right">
                                        <ResetPasswordButton userId={user.id} />
                                    </div>
                                    <div className="inline-block w-1/11 text-right">
                                        <DeleteUserButton userId={user.id} />
                                    </div>
                                    <div className="inline-block w-1/11 text-right">
                                        <SendNotificationButton userId={user.id} userName={user.name} />
                                    </div>
                                </>)}
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-400">
                        hoe tf ben jij hier gekomen?
                    </div>
                )}
            </div>

            {renderPagination(totalPages, currentPage, "gebruikers")}
        </>
    );

    const renderListsList = (lists: any[], totalPages: number, currentPage: number) => (
        <>
            <h1 className="font-extrabold text-2xl py-4">{listTotal} lijsten in db</h1>
            <div className="border w-33/34 border-neutral-700 rounded-md overflow-hidden">
                {lists.length > 0 ? (
                    lists.map((list) => (
                        <div
                            key={list.list_id}
                            className="relative border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all"
                        >
                            <Link
                                href={`/learn/viewlist/${list.list_id}`}
                                className="inline-block w-9/10 "
                            >
                                <div className={` flex items-center cursor-pointer`}>
                                    <div className="mr-4 flex-shrink-0">
                                        {list?.subject ? (
                                            <Image
                                                src={
                                                    getSubjectIcon(list.subject) || "/default-icon.svg"
                                                }
                                                alt={`${list.subject} icon`}
                                                width={40}
                                                height={40}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            ""
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <h3 className="font-medium text-lg">{list.name}</h3>
                                        <span>Gemaakt door {userMapById[list.creator]?.name}</span>
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
                        WAT! er zijn geen lijsten?!?!?
                    </div>
                )}
            </div>

            {renderPagination(totalPages, currentPage, "lijsten")}
        </>
    );

    // Count totals concurrently
    const [usersTotal, listsTotal, groupsTotal] = await Promise.all([
        prisma.user.count(),
        prisma.practice.count(),
        prisma.group.count(),
    ]);

    const currentUserId = session?.id;

    return (
        <AdminTabs
            initialUsersData={usersData}
            initialUsersTotal={usersTotal}
            initialListsData={listsData}
            initialListsTotal={listsTotal}
            initialGroupsData={groupsData}
            initialGroupsTotal={groupsTotal}
            userMapById={userMapById}
            defaultActiveTab={defaultActiveTab}
            currentUserId={currentUserId}
        />
    );
}
