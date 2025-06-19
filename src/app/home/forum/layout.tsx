// filepath: src/app/home/forum/layout.tsx
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import ForumHeaderTabs from "@/components/ForumHeaderTabs";
import { ReactNode } from "react";
import { prisma } from "@/utils/prisma";

interface ForumLayoutProps {
    children: ReactNode;
    params: { tab?: string[] };
}

export default async function ForumLayout({ children, params }: ForumLayoutProps) {
    const defaultTab = params.tab && params.tab.length > 0 ? params.tab[0] : "questions";
    const session = await getUserFromSession(
        (await cookies()).get("polarlearn.session-id")!.value
    );
    const banned = !session?.forumAllowed;
    const banReason = session?.forumBanReason;
    const banEnd = session?.forumBanEnd;
    const baseRoute = "/home/forum";
    // Define forum tabs, restricting personal tabs to logged-in users
    const tabs = [
        { id: "questions", label: "Alle vragen", content: <></> },
        ...(session?.id ? [
            { id: "my-questions", label: "Mijn vragen", content: <></> },
            { id: "my-answers", label: "Mijn antwoorden", content: <></> },
        ] : []),
        { id: "how-the-forum-works", label: "Hoe werkt het forum?", content: <></> },
    ];

    const forumDisabled = await prisma.config.findFirst({
        where: { key: 'forum_enabled' },
    })
    return (
        <>
            {/* Header and tabs (client-side hide on non-tab routes) */}
            <ForumHeaderTabs
                tabs={tabs}
                defaultTab={defaultTab}
                baseRoute={baseRoute}
                banned={banned}
                forumDisabled={forumDisabled?.value === 'false'}
                banReason={banReason}
                banEnd={banEnd}
            />

            {/* Content area */}
            <div className="mt-4">
                {children}
            </div>
        </>
    );
}
