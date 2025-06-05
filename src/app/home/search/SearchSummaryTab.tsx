"use client";

import { useState } from "react";
import { getSearchResults } from "./getSearchResults";
import Link from "next/link";
import Image from "next/image";
import { PencilIcon } from "lucide-react";
import DeleteListButton from "@/components/learning/DeleteListButton";
import ClientCreatorLink from "@/components/ClientCreatorLink";
import InfiniteScroll from "react-infinite-scroll-component";
import { getSubjectIcon, getSubjectName } from "@/components/icons";

interface SearchListsTabProps {
    query: string;
    initialSummaries: any[];
    initialTotal: number;
    initialUserMapById: Record<string, any>;
    initialUserMapByName: Record<string, any>;
    currentUserName: string | null;
    currentUserRole: string | null;
}

export default function SearchSummaryTab({
    query,
    initialSummaries,
    initialTotal,
    initialUserMapById,
    initialUserMapByName,
    currentUserName,
    currentUserRole,
}: SearchListsTabProps) {
    const [lists, setLists] = useState(initialSummaries);
    const [hasMore, setHasMore] = useState(initialSummaries.length < initialTotal);
    const [userMapById, setUserMapById] = useState(initialUserMapById);
    const [userMapByName, setUserMapByName] = useState(initialUserMapByName);
    const [loading, setLoading] = useState(false);

    const loadMoreLists = async () => {
        if (loading) return;

        setLoading(true);
        try {
            const result = await getSearchResults(query, "summaries", lists.length, 20);

            if (result.results.length === 0) {
                setHasMore(false);
            } else {
                setLists((prevLists) => [...prevLists, ...result.results]);
                setHasMore(result.hasMore);
            }

            // Merge user maps
            setUserMapById((prev) => ({ ...prev, ...result.userMapById }));
            setUserMapByName((prev) => ({ ...prev, ...result.userMapByName }));
        } catch (error) {
            console.error("Error loading more lists:", error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    if (lists.length === 0 && !hasMore) {
        return (
            <div className="text-center text-neutral-400 py-8">
                Geen samenvattingen gevonden voor "{query}".
            </div>
        );
    }

    return (
        <InfiniteScroll
            dataLength={lists.length}
            next={loadMoreLists}
            hasMore={hasMore}
            loader={
                <div className="text-center p-4">
                    Laden...
                </div>
            }
            scrollThreshold={0.8}
        >
            <div className="space-y-4">
                {lists.map((list) => {
                    const creatorId = list.creator;
                    const user = userMapById[creatorId] || userMapByName[creatorId];

                    return (
                        <div key={list.list_id} className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                            <Link href={`/learn/summary/${list.list_id}`} className="flex-1 flex items-center">
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
                                </div>
                                <div className="flex-grow"/>
                            </Link>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                                <ClientCreatorLink
                                    creator={user?.name || list.creator}
                                    user={user}
                                />
                            </div>
                            {(list.creator === currentUserName || currentUserRole === "admin") && (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/learn/editsummary/${list.list_id}`}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors"
                                        title="Lijst bewerken"
                                    >
                                        <PencilIcon className="h-5 w-5 text-white" />
                                    </Link>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                                        <DeleteListButton
                                            listId={String(list.list_id)}
                                            isCreator={true}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </InfiniteScroll>
    );
}