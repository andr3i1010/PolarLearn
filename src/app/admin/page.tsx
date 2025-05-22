import { prisma } from "@/utils/prisma";
import Image from "next/image";
import Link from "next/link";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
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
        {} as Record<string, any>
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
