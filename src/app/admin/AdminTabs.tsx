"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Jdenticon from "@/components/Jdenticon";
import DeleteListButton from "@/components/learning/DeleteListButton";
import BanButton from "./banButton";
import DeleteGroupButton from "@/components/groups/DeleteGroupButton";
import DeleteUserButton from "./DeleteUserButton";
import ResetPasswordButton from "./ResetPasswordButton";
import ImpersonateUserButton from "./ImpersonateUserButton";
import JweDecoderWrapper from "./JweDecoderWrapper";
import Tabs, { TabItem } from "@/components/Tabs";
import { getAdminData } from "./getAdminData";
import InfiniteScroll from "react-infinite-scroll-component";
import { icons, getSubjectIcon, getSubjectName } from "@/components/icons";
import { Users, ListTodo, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SendNotificationButton from "./SendNotificationButton";

interface AdminTabsProps {
    initialUsersData: any[];
    initialUsersTotal: number;
    initialListsData: any[];
    initialListsTotal: number;
    initialGroupsData: any[];
    initialGroupsTotal: number;
    userMapById: Record<string, any>;
    defaultActiveTab: string;
    currentUserId: string | null;
}

export default function AdminTabs({
    initialUsersData,
    initialUsersTotal,
    initialListsData,
    initialListsTotal,
    initialGroupsData,
    initialGroupsTotal,
    userMapById: initialUserMapById,
    defaultActiveTab,
    currentUserId,
    renderContent = true, // Added for layout usage
}: AdminTabsProps & { renderContent?: boolean }) { // Added for layout usage
    // Users tab state
    const [usersData, setUsersData] = useState(initialUsersData);
    const [usersHasMore, setUsersHasMore] = useState(initialUsersData.length < initialUsersTotal);
    const [usersTotal, setUsersTotal] = useState(initialUsersTotal);

    // Lists tab state
    const [listsData, setListsData] = useState(initialListsData);
    const [listsHasMore, setListsHasMore] = useState(initialListsData.length < initialListsTotal);
    const [listsTotal, setListsTotal] = useState(initialListsTotal);

    // Groups tab state
    const [groupsData, setGroupsData] = useState(initialGroupsData);
    const [groupsHasMore, setGroupsHasMore] = useState(initialGroupsData.length < initialGroupsTotal);
    const [groupsTotal, setGroupsTotal] = useState(initialGroupsTotal);

    const [userMapById, setUserMapById] = useState(initialUserMapById);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingLists, setLoadingLists] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false);    // Load more users
    const loadMoreUsers = async () => {
        if (loadingUsers) return;
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
            setUsersHasMore(false);
        } finally {
            setLoadingUsers(false);
        }
    };    // Load more lists
    const loadMoreLists = async () => {
        if (loadingLists) return;
        setLoadingLists(true);

        try {
            const result = await getAdminData("lijsten", listsData.length, 20);

            if (result.data.length === 0) {
                setListsHasMore(false);
            } else {
                setListsData((prevData) => [...prevData, ...result.data]);
                setListsHasMore(result.hasMore);
                setListsTotal(result.total);

                // Merge user maps
                setUserMapById((prev) => ({ ...prev, ...result.userMapById }));
            }
        } catch (error) {
            console.error("Error loading more lists:", error);
            setListsHasMore(false);
        } finally {
            setLoadingLists(false);
        }
    };    // Load more groups
    const loadMoreGroups = async () => {
        if (loadingGroups) return;
        setLoadingGroups(true);

        try {
            const result = await getAdminData("groepen", groupsData.length, 20);

            if (result.data.length === 0) {
                setGroupsHasMore(false);
            } else {
                setGroupsData((prevData) => [...prevData, ...result.data]);
                setGroupsHasMore(result.hasMore);
                setGroupsTotal(result.total);

                // Merge user maps
                setUserMapById((prev) => ({ ...prev, ...result.userMapById }));
            }
        } catch (error) {
            console.error("Error loading more groups:", error);
            setGroupsHasMore(false);
        } finally {
            setLoadingGroups(false);
        }
    };

    // Render user list component
    const renderUserList = () => {
        if (usersData.length === 0 && !usersHasMore) {
            return (
                <div className="p-8 text-center text-gray-400">
                    Geen gebruikers gevonden.
                </div>
            );
        }

        return (
            <>
                <h1 className="font-extrabold text-2xl pb-4">
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
                        <div className="border w-33/34 border-neutral-700 rounded-md overflow-hidden bg-neutral-800">
                            {usersData.map((user) => (
                                <div
                                    key={user.id}
                                    className="relative border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all"
                                >
                                    <Link
                                        href={`/home/viewuser/${user.id}`}
                                        className="inline-block w-7/11"
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
                                                        ? " reden: "
                                                        : ""}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                    {user.role !== "admin" && (
                                        <>
                                            <div className="inline-block w-1/11 text-right">
                                                {!user.forumAllowed ? (
                                                    <BanButton
                                                        userId={user.id}
                                                        text="unban van forum"
                                                        platform={false}
                                                        unban={true}
                                                    />
                                                ) : (
                                                    <BanButton
                                                        userId={user.id}
                                                        text="ban van forum"
                                                        platform={false}
                                                        unban={false}
                                                    />
                                                )}
                                            </div>
                                            <div className="inline-block w-1/11 text-right">
                                                {!user.loginAllowed ? (
                                                    <BanButton
                                                        userId={user.id}
                                                        text="unban van site"
                                                        platform={true}
                                                        unban={true}
                                                    />
                                                ) : (
                                                    <BanButton
                                                        userId={user.id}
                                                        text="ban van site"
                                                        platform={true}
                                                        unban={false}
                                                    />
                                                )}
                                            </div>
                                            <div className="inline-block w-1/11 text-right">
                                                <ResetPasswordButton userId={user.id} />
                                            </div>
                                            <div className="inline-block w-1/11 text-right">
                                                <DeleteUserButton userId={user.id} />
                                            </div>
                                            <div className="inline-block w-1/11 text-right">
                                                <ImpersonateUserButton
                                                    userId={user.id}
                                                    userName={user.name}
                                                />
                                            </div>
                                            <div className="inline-block w-1/11 text-right">
                                                <SendNotificationButton userId={user.id} userName={user.name} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </InfiniteScroll>
                </div>
            </>
        );
    };

    // Render lists tab component
    const renderListsList = () => {
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
                        <div className="border w-33/34 border-neutral-700 rounded-md overflow-hidden bg-neutral-800">
                            {listsData.map((list) => (
                                <div
                                    key={list.list_id}
                                    className="relative border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-4 hover:bg-neutral-700 transition-all"
                                >
                                    <Link
                                        href={`/learn/viewlist/${list.list_id}`}
                                        className="inline-block w-9/10"
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
                                                    {list.published ? (
                                                        ""
                                                    ) : (
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
                                    <div className="inline-block w-1/10">
                                        <DeleteListButton
                                            listId={list.list_id}
                                            isCreator={true}
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
    };

    // Render groups tab component
    const renderGroupList = () => {
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
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[150px] text-center">
                                                <p className="text-sm text-neutral-400 line-clamp-1">{groep.description}</p>
                                            </div>
                                        )}

                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
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
    };

    const tabs: TabItem[] = [
        {
            id: "gebruikers",
            label: (
                <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>Gebruikers</span>
                </div>
            ),
            content: renderUserList(),
        },
        {
            id: "lijsten",
            label: (
                <div className="flex items-center gap-2">
                    <ListTodo size={16} />
                    <span>Lijsten</span>
                </div>
            ),
            content: renderListsList(),
        },
        {
            id: "groepen",
            label: (
                <div className="flex items-center gap-2">
                    <School size={16} />
                    <span>Groepen</span>
                </div>
            ),
            content: renderGroupList(),
        },
        {
            id: "jwe",
            label: "JWE decodeerder",
            content: (
                <>
                    <div className="mt-6">
                        <JweDecoderWrapper />
                    </div>
                </>
            ),
        },
    ];

    // Determine the base route dynamically
    let baseRoute = "/admin";

    return (
        <div className="py-6 pl-6">
            <div className="flex items-center">
                <h1 className="text-4xl font-extrabold mb-4">admin</h1>
                <div className="flex-grow"></div>
                <div className="w-4" />
            </div>
            <Tabs
                tabs={tabs}
                defaultActiveTab={defaultActiveTab}
                withRoutes={true}
                baseRoute={baseRoute}
                renderContent={renderContent} // Pass down renderContent
            />
        </div>
    );
}
