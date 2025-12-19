import Image from "next/image";
import Link from "next/link";
import { PencilIcon } from "lucide-react";
import DeleteListButton from "@/components/learning/DeleteListButton";
import { getSubjectIcon, getSubjectName } from "@/components/icons";
import CreatorLink from "@/components/CreatorLink";
import { Badge } from '@/components/ui/badge';

interface PracticeList {
    list_id: string;
    name: string;
    subject: string;
    createdAt: Date;
    published: boolean;
    data: any[];
    creator: string;
    // Prefetched server-side
    prefetchedName?: string;
    prefetchedJdenticonValue?: string;
    prefetchedUserId?: string | null;
}

interface ListsTabContentProps {
    lists: PracticeList[];
    currentUserName: string | null;
    currentUserRole?: string | null;
}

export default function ListsTabContent({
    lists,
    currentUserName,
    currentUserRole
}: ListsTabContentProps) {
    return (
        <div className="mt-4">
            {lists.length > 0 ? (
                <div className="space-y-4">
                    {lists.map((list) => (
                        <div key={list.list_id}>
                            <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                                <Link
                                    href={`/learn/viewlist/${list.list_id}`}
                                    className="flex-1 flex items-center"
                                >
                                    <div className="flex items-center">
                                        {list.subject && (
                                            <Image
                                                src={getSubjectIcon(list.subject) || ""}
                                                alt={`${getSubjectName(list.subject)} icon`}
                                                width={24}
                                                height={24}
                                                className="mr-2"
                                            />
                                        )}
                                        <span className="text-lg whitespace-normal break-words max-w-[40ch]">
                                            {list.name}
                                        </span>
                                        {!list.published && (
                                            <Badge variant="secondary" className="ml-2 bg-amber-600/20 text-amber-500 border border-amber-600/50 text-xs">
                                                Concept
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex-grow"></div>
                                    <div className="flex items-center pr-2">
                                        {Array.isArray(list.data) && list.data.length === 1
                                            ? "1 woord"
                                            : `${Array.isArray(list.data) ? list.data.length : 0} woorden`}
                                    </div>
                                </Link>

                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-auto">
                                    <CreatorLink
                                        creator={list.creator}
                                        userId={list.prefetchedUserId}
                                        displayName={list.prefetchedName}
                                    />
                                </div>

                                {/* Action buttons for list owner */}
                                {(list.creator === currentUserName || currentUserRole === "admin") && (
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/learn/editlist/${list.list_id}`}
                                            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                                            title="Lijst bewerken"
                                        >
                                            <PencilIcon className="h-5 w-5 text-white" />
                                        </Link>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                                            <DeleteListButton
                                                listId={list.list_id}
                                                isCreator={list.creator === currentUserName || currentUserRole === "admin"}
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
                    Geen lijsten gevonden
                </div>
            )}
        </div>
    );
}
