import ViewUserTabsWrapper from "./ViewUserTabsWrapper";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { prisma } from "@/utils/prisma";
import { notFound } from "next/navigation";

interface ViewUserLayoutProps {
    children: React.ReactNode;
    params: Promise<{ id: string; tab?: string[] }>;
}

export default async function ViewUserLayout({
    children,
    params: paramsPromise,
}: ViewUserLayoutProps) {
    const params = await paramsPromise;
    const { id } = params;

    // Get current session for permission checks
    const sessionCookie = (await cookies()).get("polarlearn.session-id");
    const currentUser = sessionCookie
        ? await getUserFromSession(sessionCookie.value)
        : null;
    const currentUserName = currentUser?.name || null;

    // Get the user data
    let user;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    if (isUUID) {
        user = await prisma.user.findUnique({
            where: { id },
        });
    } else {
        user = await prisma.user.findFirst({
            where: { name: id },
        });
    }

    if (!user) {
        notFound();
    }

    // Determine selected tab from URL
    const selectedTab = params.tab && params.tab.length > 0 ? params.tab[0] : "lists";

    return (
        <div className="pt-4">
            <ViewUserTabsWrapper
                user={user}
                selectedTab={selectedTab}
                userId={user.id}
            />
            <div className="mt-4">
                {children}
            </div>
        </div>
    );
}
