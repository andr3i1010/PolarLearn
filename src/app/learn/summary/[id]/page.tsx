import { prisma } from "@/utils/prisma"
import { getSubjectIcon } from "@/components/icons"
import Image from "next/image"
import MarkdownRenderer from "@/components/md"
import CreatorLink from "@/components/links/CreatorLink"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const summary = await prisma.practice.findFirst({
        where: {
            mode: "summary",
            list_id: id
        }
    })
    return (
        <div className="pl-8 pt-10">
            <div className="flex flex-col justify-between mb-4">
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