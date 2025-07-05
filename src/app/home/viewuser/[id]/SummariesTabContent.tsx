import Image from "next/image";
import Link from "next/link";
import { PencilIcon } from "lucide-react";
import DeleteListButton from "@/components/learning/DeleteListButton";
import { getSubjectIcon, getSubjectName } from "@/components/icons";
import CreatorLink from "@/components/links/CreatorLink";

interface Summary {
    list_id: string;
    name: string;
    subject: string;
    createdAt: Date;
    published: boolean;
    creator: string;
}

interface SummariesTabContentProps {
    summaries: Summary[];
    currentUserName: string | null;
    currentUserRole?: string | null;
}

export default function SummariesTabContent({
    summaries,
    currentUserName,
    currentUserRole
}: SummariesTabContentProps) {
    return (
        <div className="mt-4">
            {summaries.length > 0 ? (
                <div className="space-y-4">
                    {summaries.map((summary) => (
                        <div key={summary.list_id}>
                            <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer mb-4">
                                <Link
                                    href={`/learn/summary/${summary.list_id}`}
                                    className="flex-1 flex items-center"
                                >
                                    <div className="flex items-center">
                                        {summary.subject && (
                                            <Image
                                                src={getSubjectIcon(summary.subject) || ""}
                                                alt={`${getSubjectName(summary.subject)} icoon`}
                                                width={24}
                                                height={24}
                                                className="mr-2"
                                            />
                                        )}
                                        <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                                            {summary.name}
                                        </span>
                                        {!summary.published && (
                                            <span className="ml-2 inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                                                Concept
                                            </span>
                                        )}
                                    </div>
                                </Link>

                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                                    <CreatorLink creator={summary.creator} />
                                </div>

                                {/* Action buttons for summary owner */}
                                {(summary.creator === currentUserName || currentUserRole === "admin") && (
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/learn/editsummary/${summary.list_id}`}
                                            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                                            title="Samenvatting bewerken"
                                        >
                                            <PencilIcon className="h-5 w-5 text-white" />
                                        </Link>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                                            <DeleteListButton
                                                listId={summary.list_id}
                                                isCreator={summary.creator === currentUserName || currentUserRole === "admin"}
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
                    Geen samenvattingen gevonden
                </div>
            )}
        </div>
    );
}
