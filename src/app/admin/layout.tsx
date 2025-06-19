// filepath: /workspaces/polarlearn/src/app/admin/layout.tsx
import AdminNavWrapper from "./AdminNavWrapper";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { prisma } from "@/utils/prisma";
import Image from "next/image";
import Link from "next/link";
import Button1 from "@/components/button/Button1";

export default async function AdminLayout({
    children,
    params: paramsPromise, // Renamed to indicate it's a Promise
}: {
    children: React.ReactNode;
    params: Promise<{ tab?: string[] }>; // Changed to Promise type
}) {
    const params = await paramsPromise; // Resolve the Promise
    const defaultActiveTab =
        params?.tab && params.tab.length > 0
            ? params.tab[0]
            : "algemeen";

    const sessionCookie = (await cookies()).get("polarlearn.session-id");
    const session = sessionCookie ? await getUserFromSession(sessionCookie.value) : null;

    if (session?.role !== "admin" || !session) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <Image
                    src={require("@/app/admin/ga_weg.png")}
                    alt="aardige man"
                    width={300}
                    height={300}
                    className="mb-4"
                />
                <h1 className="text-4xl font-extrabold mb-4">ga weg</h1>
                <p>Hoe ben je hier gekomen?</p>
                <Link href="/home/start">
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
        <div className="py-6 pl-6">
            <div className="flex items-center">
                <h1 className="text-4xl font-extrabold mb-4">admin</h1>
                <div className="flex-grow"></div>
                <div className="w-4" />
            </div>
            <AdminNavWrapper
                defaultActiveTab={defaultActiveTab}
            />
            <div className="mt-4">
                {children}
            </div>
        </div>
    );
}
