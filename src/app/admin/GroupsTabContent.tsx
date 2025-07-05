"use client";

import { useState } from "react";
import Link from "next/link";
import Jdenticon from "@/components/Jdenticon";
import DeleteGroupButton from "@/components/groups/DeleteGroupButton";
import { getAdminData } from "./getAdminData";
import InfiniteScroll from "react-infinite-scroll-component";
import { Badge } from "@/components/ui/badge";

interface GroupsTabContentProps {
    initialGroupsData: any[];
    initialGroupsTotal: number;
    initialUserMapById: Record<string, any>; // If needed for group creator/admin names
}

export default function GroupsTabContent({
    initialGroupsData,
    initialGroupsTotal,
    initialUserMapById, // Not used in current render but good to have if needed
}: GroupsTabContentProps) {
    const [groupsData, setGroupsData] = useState(initialGroupsData);
    const [groupsHasMore, setGroupsHasMore] = useState(initialGroupsData.length < initialGroupsTotal);
    const [groupsTotal, setGroupsTotal] = useState(initialGroupsTotal);
    const [userMapById, setUserMapById] = useState(initialUserMapById); // Store if needed later
    const [loadingGroups, setLoadingGroups] = useState(false);

    const loadMoreGroups = async () => {
        if (loadingGroups || !groupsHasMore) return;
        setLoadingGroups(true);
        try {
            const result = await getAdminData("groepen", groupsData.length, 20);
            if (result.data.length === 0) {
                setGroupsHasMore(false);
            } else {
                setGroupsData((prevData) => [...prevData, ...result.data]);
                setGroupsHasMore(result.hasMore);
                setGroupsTotal(result.total);
                setUserMapById((prev) => ({ ...prev, ...result.userMapById }));
            }
        } catch (error) {
            console.error("Error loading more groups:", error);
            setGroupsHasMore(false);
        } finally {
            setLoadingGroups(false);
        }
    };

    if (groupsData.length === 0 && !groupsHasMore) {
        return (
            <div className="p-8 text-center text-gray-400">
                Geen groepen gevonden.
            </div>
        );
    }

    return (
        <>
            <h1 className="font-extrabold text-2xl py-4">
                {groupsTotal} groepen in db
            </h1>
            <div className="rounded-md">
                <InfiniteScroll
                    dataLength={groupsData.length}
                    next={loadMoreGroups}
                    hasMore={groupsHasMore}
                    loader={
                        <div className="text-center p-4 bg-neutral-800 rounded-md my-4">
                            Laden...
                        </div>
                    }
                    scrollThreshold={0.8}
                    style={{ overflow: "visible" }}
                >
                    <div className="space-y-4">
                        {groupsData.map((groep) => {
                            const memberCount = groep.members && typeof groep.members === 'object'
                                ? Object.keys(groep.members).length
                                : 0;
                            const listCount = groep.listsAdded && Array.isArray(groep.listsAdded)
                                ? groep.listsAdded.length
                                : 0;

                            return (
                                <div
                                    key={groep.groupId}
                                    className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-2 px-6 rounded-lg min-h-20 h-auto flex items-center justify-between"
                                >
                                    <Link
                                        href={`/learn/group/${groep.groupId}`}
                                        className="flex-1 flex items-center"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Jdenticon value={groep.name} size={40} />
                                            <span className="text-lg whitespace-normal break-words max-w-[40ch] flex flex-row">
                                                {groep.name}
                                                <div className="flex gap-2 mt-1 pl-2">
                                                    {groep.requiresApproval && (
                                                        <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/50 text-xs">
                                                            Goedkeuring vereist
                                                        </Badge>
                                                    )}
                                                </div>
                                            </span>
                                        </div>
                                        <div className="flex-grow"></div>
                                        <div className="flex items-center pr-2">
                                            <span className="text-sm text-neutral-400">
                                                {memberCount} {memberCount === 1 ? "lid" : "leden"} •
                                                {listCount} {listCount === 1 ? "lijst" : "lijsten"}
                                            </span>
                                        </div>
                                    </Link>

                                    {groep.description && (
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[150px] text-center hidden md:block">
                                            <p className="text-sm text-neutral-400 line-clamp-1">{groep.description}</p>
                                        </div>
                                    )}

                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors ml-4">
                                        <DeleteGroupButton groupId={groep.groupId} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </InfiniteScroll>
            </div>
        </>
    );
}
