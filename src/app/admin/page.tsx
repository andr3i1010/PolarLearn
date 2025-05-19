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
import { cookies } from "next/headers";
import DeleteGroupButton from "@/components/groups/DeleteGroupButton";
import { getSubjectIcon } from "@/components/icons";
import DeleteUserButton from "./DeleteUserButton";
import ResetPasswordButton from "./ResetPasswordButton";
import ImpersonateUserButton from "./ImpersonateUserButton";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export default async function AdminPage({
    params,
    searchParams,
}: {
    params?: Promise<{ tab?: string[] }>;
    searchParams?: Promise<{ page?: string }>;
}) {
    const awaitedParams = params ? await params : undefined;
    const defaultActiveTab =
        awaitedParams?.tab && awaitedParams.tab.length > 0 ? awaitedParams.tab[0] : "gebruikers";

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

    const page = parseInt((await searchParams)?.page || "1");
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
                createdAt: "desc",
            },
            skip,
            take,
        }),
        prisma.practice.count(),
    ]);

    const [groupList, groupTotal] = await Promise.all([
        prisma.group.findMany({
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take,
        }),
        prisma.group.count(),
    ]);

    const totalUserPages = Math.ceil(totalUsers / take);
    const totalListPages = Math.ceil(listTotal / take);
    const totalGroupPages = Math.ceil(groupTotal / take);
    const currentUserId = session?.id;

    const creatorIds = [...new Set([...listslist].map((post) => post.creator))];

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
    const userMapById = users.reduce(
        (acc: Record<string, UserInfo>, user: UserInfo) => {
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
                                        <ImpersonateUserButton userId={user.id} userName={user.name} />
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

    const renderGroupList = (groepen: any[], totalPages: number, currentPage: number) => (
        <>
            <h1 className="font-extrabold text-2xl py-4">{groupTotal} groepen in db</h1>
            <div className="border w-33/34 border-neutral-700 rounded-md overflow-hidden">
                {groepen.length > 0 ? (
                    groepen.map((groep) => (
                        <div
                            key={groep.groupId}
                            className="relative border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all flex row"
                        >
                            <Link
                                href={`/learn/group/${groep.groupId}`}
                                className="inline-block w-9/10 "
                            >
                                <div className={` flex items-center cursor-pointer`}>
                                    <div className="mr-4 flex-shrink-0">
                                        <Jdenticon value={groep?.name as string} size={70} />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <h3 className="font-medium text-lg">{groep.name}</h3>
                                        <span>
                                            {groep.description} | Gemaakt door{" "}
                                            {userMapById[groep.creator]?.name || "Onbekende gebruiker"}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                            <div className="inline-block w-1/10 ">
                                <DeleteGroupButton groupId={groep.groupId} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-400">
                        er zijn geen groepen!
                    </div>
                )}
            </div>

            {renderPagination(totalPages, currentPage, "groepen")}
        </>
    );

    const tabs: TabItem[] = [
        {
            id: "gebruikers",
            label: "Gebruikers",
            content: renderUserList(userslist, totalUserPages, page),
        },
        {
            id: "lijsten",
            label: "Lijsten",
            content: renderListsList(listslist, totalListPages, page),
        },
        {
            id: "groepen",
            label: "Groepen",
            content: renderGroupList(groupList, totalGroupPages, page),
        },
    ];

    // Determine the base route dynamically
    let baseRoute = "/admin";

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
                    baseRoute={baseRoute}
                />
            </div>
        </>
    );
}
