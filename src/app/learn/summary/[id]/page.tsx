import { prisma } from "@/utils/prisma"
import { getSubjectIcon, getSubjectName } from "@/components/icons"
import Image from "next/image"
import MarkdownRenderer from "@/components/md"
import CreatorLink from "@/components/links/CreatorLink"
import { Metadata } from "next"
import { addToRecentLists } from "@/utils/actions/updateRecentLists"
import { addToRecentSubjects } from "@/utils/actions/updateRecentSubjects"
import { getUserFromSession } from "@/utils/auth/auth"
import { cookies } from "next/headers"
import Link from "next/link"
import { PencilIcon } from "lucide-react"
import DeleteSummaryButton from "@/components/learning/DeleteSummaryButton"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;

    try {
        const summary = await prisma.practice.findFirst({
            where: {
                mode: "summary",
                list_id: id
            },
            select: {
                name: true,
                subject: true,
                summaryContent: true,
                creator: true
            }
        });

        if (!summary) {
            return {
                title: "Samenvatting niet gevonden | PolarLearn",
                description: "De gevraagde samenvatting kon niet worden gevonden.",
            };
        }        // Create title with the specified format
        const title = `PolarLearn Samenvatting | ${summary.name}`;

        // Create description from truncated summary content
        let description = "Bekijk deze samenvatting op PolarLearn";
        if (summary.summaryContent) {
            // Clean the markdown content for description
            const cleanContent = summary.summaryContent
                .replace(/[#*`_~\[\]()]/g, '') // Remove markdown characters
                .replace(/\n+/g, ' ') // Replace newlines with spaces
                .trim();

            if (cleanContent) {
                // Use the cleaned content as description, truncated to fit SEO limits
                description = cleanContent.substring(0, 160);
            }
        }

        return {
            title,
            description, // Already truncated to 160 characters
        };
    } catch (error) {
        return {
            title: "PolarLearn Samenvattingen",
            description: "Bestudeer samenvattingen en verbeter je kennis op PolarLearn",
        };
    }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const summary = await prisma.practice.findFirst({
        where: {
            mode: "summary",
            list_id: id
        }
    })

    // Get current user for permission checks
    const currentUser = await getUserFromSession(
        (await cookies()).get("polarlearn.session-id")?.value as string
    );
    const currentUserName = currentUser?.name;
    const currentUserRole = currentUser?.role;

    // Add this summary to user's recent lists
    if (summary) {
        await addToRecentLists(id);

        // Also add the subject to recent subjects if available
        if (summary.subject) {
            await addToRecentSubjects(summary.subject);
        }
    }

    return (
        <div className="pl-8 pt-10">
            <div className="flex flex-col justify-between mb-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-extrabold flex flex-row">
                        <Image
                            src={getSubjectIcon(summary?.subject || "OT")}
                            alt={summary?.subject ? `${summary.subject} icon` : "Vakken icoon"}
                            width={40}
                            height={40}
                            className="mr-4"
                        />
                        {summary?.name}
                    </h1>
                    {/* Action buttons for summary owner */}
                    {summary && (summary.creator === currentUserName || summary.creator === currentUser?.id || currentUserRole === "admin") && (
                        <div className="flex items-center gap-3 mr-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                                <Link
                                    href={`/learn/editsummary/${summary.list_id}`}
                                    className="flex h-12 w-12 items-center justify-center rounded-full transition-colors"
                                    title="Samenvatting bewerken"
                                >
                                    <PencilIcon className="h-6 w-6 text-white" />
                                </Link>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                                <DeleteSummaryButton summaryId={summary.list_id} />
                            </div>
                        </div>
                    )}
                </div>
                {summary?.creator && (
                    <div className="flex items-center">
                        <span className="text-md text-gray-500 mr-2 justify-center">Gemaakt door:</span>
                        <CreatorLink creator={summary.creator} />
                    </div>
                )}
            </div>
            <MarkdownRenderer
                content={summary?.summaryContent as string}
            />
        </div>
    )
}