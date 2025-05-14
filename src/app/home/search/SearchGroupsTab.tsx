"use client";

import { useState } from "react";
import Link from "next/link";
import { getSearchResults } from "./getSearchResults";
import InfiniteScroll from "react-infinite-scroll-component";
import Jdenticon from "@/components/Jdenticon";
import { Badge } from "@/components/ui/badge";

interface SearchGroupsTabProps {
    query: string;
    initialGroups: any[];
    initialTotal: number;
    initialUserMapById: Record<string, any>;
    initialUserMapByName: Record<string, any>;
}

export default function SearchGroupsTab({
    query,
    initialGroups,
    initialTotal,
    initialUserMapById,
    initialUserMapByName,
}: SearchGroupsTabProps) {
    const [groups, setGroups] = useState(initialGroups);
    const [hasMore, setHasMore] = useState(initialGroups.length < initialTotal);
    const [userMapById, setUserMapById] = useState(initialUserMapById);
    const [userMapByName, setUserMapByName] = useState(initialUserMapByName);
    const [loading, setLoading] = useState(false);

    const loadMoreGroups = async () => {
        if (loading) return;

        setLoading(true);
        try {
            const result = await getSearchResults(query, "groups", groups.length, 20);

            if (result.results.length === 0) {
                setHasMore(false);
            } else {
                setGroups((prevGroups) => [...prevGroups, ...result.results]);
                setHasMore(result.hasMore);
            }

            // Merge user maps
            setUserMapById((prev) => ({ ...prev, ...result.userMapById }));
            setUserMapByName((prev) => ({ ...prev, ...result.userMapByName }));
        } catch (error) {
            console.error("Error loading more groups:", error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    if (groups.length === 0 && !hasMore) {
        return (
            <div className="text-center text-neutral-400 py-8">
                Geen groepen gevonden voor "{query}".
            </div>
        );
    }

    return (
        <InfiniteScroll
            dataLength={groups.length}
            next={loadMoreGroups}
            hasMore={hasMore}
            loader={
                <div className="text-center p-4">
                    Laden...
                </div>
            }
            scrollThreshold={0.8}
        >
            <div className="space-y-4">
                {groups.map((group) => {
                    const creatorId = group.creator;
                    const user = userMapById[creatorId] || userMapByName[creatorId];
                    const memberCount = Array.isArray(group.members) ? group.members.length : 0;
                    const listCount = Array.isArray(group.listsAdded) ? group.listsAdded.length : 0;

                    return (
                        <div key={group.groupId}>
                            <div className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 mx-4 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer">
                                <Link href={`/learn/group/${group.groupId}`} className="flex-1 flex items-center">
                                    <div className="flex items-center gap-3">
                                        <Jdenticon value={group.name} size={40} />
                                        <span className="text-lg whitespace-normal break-words max-w-[40ch] flex flex-row">
                                            {group.name}
                                            <div className="flex gap-2 mt-1 pl-2">
                                                {group.requiresApproval ? (
                                                    <Badge className="bg-amber-600/20 text-amber-500 border border-amber-600/50 text-xs">
                                                        Goedkeyring nodig
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-green-600/20 text-green-500 border border-green-600/50 text-xs">
                                                        Open
                                                    </Badge>
                                                )}
                                            </div>
                                        </span>
                                    </div>
                                    <div className="flex-grow"></div>
                                    <div className="flex items-center pr-2">
                                        <span className="text-sm text-neutral-400">
                                            {memberCount} {memberCount === 1 ? "lid" : "leden"} •{" "}
                                            {listCount} {listCount === 1 ? "lijst" : "lijsten"}
                                        </span>
                                    </div>
                                </Link>

                                {group.description && (
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[150px] text-center">
                                        <p className="text-sm text-neutral-400 line-clamp-1">{group.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </InfiniteScroll>
    );
}
