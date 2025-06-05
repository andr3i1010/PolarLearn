"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DeleteListButton from "@/components/learning/DeleteListButton";
import { getAdminData } from "./getAdminData";
import InfiniteScroll from "react-infinite-scroll-component";
import { getSubjectIcon, getSubjectName } from "@/components/icons";

interface ListsTabContentProps {
    initialListsData: any[];
    initialListsTotal: number;
    initialUserMapById: Record<string, any>;
    currentUserId: string | null; // Or however you determine if user is creator for delete
}

export default function ListsTabContent({
    initialListsData,
    initialListsTotal,
    initialUserMapById,
    currentUserId,
}: ListsTabContentProps) {
    const [listsData, setListsData] = useState(initialListsData);
    const [listsHasMore, setListsHasMore] = useState(initialListsData.length < initialListsTotal);
    const [listsTotal, setListsTotal] = useState(initialListsTotal);
    const [userMapById, setUserMapById] = useState(initialUserMapById);
    const [loadingLists, setLoadingLists] = useState(false);

    const loadMoreLists = async () => {
        if (loadingLists || !listsHasMore) return;
        setLoadingLists(true);
        try {
            const result = await getAdminData("lijsten", listsData.length, 20);
            if (result.data.length === 0) {
                setListsHasMore(false);
            } else {
                setListsData((prevData) => [...prevData, ...result.data]);
                setListsHasMore(result.hasMore);
                setListsTotal(result.total);
                setUserMapById((prev) => ({ ...prev, ...result.userMapById }));
            }
        } catch (error) {
            console.error("Error loading more lists:", error);
            setListsHasMore(false);
        } finally {
            setLoadingLists(false);
        }
    };

    if (listsData.length === 0 && !listsHasMore) {
        return (
            <div className="p-8 text-center text-gray-400">
                Geen lijsten gevonden.
            </div>
        );
    }

    return (
        <>
            <h1 className="font-extrabold text-2xl py-4">
                {listsTotal} lijsten in db
            </h1>
            <div className="rounded-md overflow-hidden">
                <InfiniteScroll
                    dataLength={listsData.length}
                    next={loadMoreLists}
                    hasMore={listsHasMore}
                    loader={
                        <div className="text-center p-4 bg-neutral-800 border border-neutral-700">
                            Laden...
                        </div>
                    }
                    scrollThreshold={0.8}
                    style={{ overflow: "visible" }}
                >
                    <div className="border w-full border-neutral-700 rounded-md overflow-hidden bg-neutral-800">
                        {listsData.map((list) => (
                            <div
                                key={list.list_id}
                                className="relative border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all flex justify-between items-center"
                            >
                                <Link
                                    href={`/learn/viewlist/${list.list_id}`}
                                    className="flex-grow"
                                >
                                    <div className="flex items-center cursor-pointer">
                                        <div className="mr-4 flex-shrink-0">
                                            {list.subject && (
                                                <Image
                                                    src={getSubjectIcon(list.subject)}
                                                    alt={getSubjectName(list.subject) || list.subject}
                                                    width={40}
                                                    height={40}
                                                    className="h-10 w-10"
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <h3 className="font-medium text-lg">
                                                {list.name}
                                                {!list.published && (
                                                    <span className="ml-2 text-sm font-medium px-2.5 py-0.5 rounded-sm bg-amber-600/20 text-amber-500 border border-amber-600/50">
                                                        Concept
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-gray-400">
                                                Gemaakt door: {userMapById[list.creator]?.name || list.creator} •
                                                {Array.isArray(list.data) && list.data.length === 1
                                                    ? " 1 woord"
                                                    : ` ${Array.isArray(list.data) ? list.data.length : 0} woorden`}
                                                {list.subject && (
                                                    <> • {getSubjectName(list.subject) || list.subject}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                                <div className="ml-4">
                                    <DeleteListButton
                                        listId={list.list_id}
                                        isCreator={true} // Admin can always delete
                                        customText="Verwijder"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </InfiniteScroll>
            </div>
        </>
    );
}
