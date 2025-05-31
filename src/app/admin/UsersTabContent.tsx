"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Jdenticon from "@/components/Jdenticon";
import BanButton from "./banButton";
import DeleteUserButton from "./DeleteUserButton";
import ResetPasswordButton from "./ResetPasswordButton";
import ImpersonateUserButton from "./ImpersonateUserButton";
import { getAdminData } from "./getAdminData";
import InfiniteScroll from "react-infinite-scroll-component";

interface UsersTabContentProps {
    initialUsersData: any[];
    initialUsersTotal: number;
    currentUserId: string | null;
}

export default function UsersTabContent({
    initialUsersData,
    initialUsersTotal,
    currentUserId,
}: UsersTabContentProps) {
    const [usersData, setUsersData] = useState(initialUsersData);
    const [usersHasMore, setUsersHasMore] = useState(initialUsersData.length < initialUsersTotal);
    const [usersTotal, setUsersTotal] = useState(initialUsersTotal);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const loadMoreUsers = async () => {
        if (loadingUsers || !usersHasMore) return;
        setLoadingUsers(true);
        try {
            const result = await getAdminData("gebruikers", usersData.length, 20);
            if (result.data.length === 0) {
                setUsersHasMore(false);
            } else {
                setUsersData((prevData) => [...prevData, ...result.data]);
                setUsersHasMore(result.hasMore);
                setUsersTotal(result.total);
            }
        } catch (error) {
            console.error("Error loading more users:", error);
            setUsersHasMore(false); // Stop trying if there's an error
        } finally {
            setLoadingUsers(false);
        }
    };

    if (usersData.length === 0 && !usersHasMore) {
        return (
            <div className="p-8 text-center text-gray-400">
                Geen gebruikers gevonden.
            </div>
        );
    }

    return (
        <>
            <h1 className="font-extrabold text-2xl pb-4 pt-4">
                {usersTotal} gebruikers in db
            </h1>
            <div className="rounded-md overflow-hidden">
                <InfiniteScroll
                    dataLength={usersData.length}
                    next={loadMoreUsers}
                    hasMore={usersHasMore}
                    loader={
                        <div className="text-center p-4 bg-neutral-800 border border-neutral-700">
                            Laden...
                        </div>
                    }
                    scrollThreshold={0.8}
                    style={{ overflow: "visible" }}
                >
                    <div className="border w-full border-neutral-700 rounded-md overflow-hidden bg-neutral-800">
                        {usersData.map((user) => (
                            <div
                                key={user.id}
                                className="relative border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all"
                            >
                                <Link
                                    href={`/home/viewuser/${user.id}`}
                                    className="inline-block w-full md:w-7/12" // Adjusted width for responsiveness
                                >
                                    <div className="flex items-center cursor-pointer">
                                        <div className="mr-4 flex-shrink-0">
                                            {user?.image ? (
                                                <Image
                                                    src={user.image}
                                                    alt={`de profielfoto van ${user.name}`}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full"
                                                />
                                            ) : (
                                                <Jdenticon value={user?.name} size={40} />
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <h3 className="font-medium text-lg">
                                                {user.name}
                                                {user.id === currentUserId ? " (jij)" : ""}
                                                {user?.role === "admin" ? " (admin)" : ""}
                                                <span> </span>
                                                {user?.forumAllowed ? (
                                                    ""
                                                ) : (
                                                    <span className="text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm bg-yellow-900 text-yellow-300">
                                                        Forum banned
                                                    </span>
                                                )}
                                                {user?.loginAllowed ? (
                                                    ""
                                                ) : (
                                                    <span className="text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm bg-red-900 text-red-300">
                                                        Banned
                                                    </span>
                                                )}
                                            </h3>
                                            <h3>email: {user?.email}</h3>
                                            <span>
                                                {user.forumAllowed
                                                    ? ""
                                                    : ` reden: ${user.forumBanReason || "geen reden opgegeven"
                                                    }`}
                                                {!user.forumAllowed && !user.loginAllowed ? ", " : ""}
                                                {!user.loginAllowed && user.forumAllowed
                                                    ? " reden: " // This part seems to be missing the reason from user.banReason
                                                    : ""}
                                                {!user.loginAllowed ? user.banReason || "geen reden opgegeven" : ""}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                                {user.role !== "admin" && (
                                    <div className="flex flex-wrap gap-2 mt-2 md:mt-0 md:absolute md:right-4 md:top-1/2 md:-translate-y-1/2 md:w-5/12 md:justify-end">
                                        {!user.forumAllowed ? (
                                            <BanButton userId={user.id} text="Unban Forum" platform={false} unban={true} />
                                        ) : (
                                            <BanButton userId={user.id} text="Ban Forum" platform={false} unban={false} />
                                        )}
                                        {!user.loginAllowed ? (
                                            <BanButton userId={user.id} text="Unban Site" platform={true} unban={true} />
                                        ) : (
                                            <BanButton userId={user.id} text="Ban Site" platform={true} unban={false} />
                                        )}
                                        <ResetPasswordButton userId={user.id} />
                                        <DeleteUserButton userId={user.id} />
                                        <ImpersonateUserButton userId={user.id} userName={user.name} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </InfiniteScroll>
            </div>
        </>
    );
}
