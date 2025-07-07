"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Jdenticon from "@/components/Jdenticon";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { Badge } from "@/components/ui/badge";
import { getSearchResults } from "./getSearchResults";
import InfiniteScroll from "react-infinite-scroll-component";
import { Book, Megaphone, MessageCircle, MessageCircleQuestion } from "lucide-react";
import { icons, getSubjectName } from "@/components/icons";

interface SearchForumTabProps {
    query: string;
    initialPosts: any[];
    initialTotal: number;
    initialUserMapById: Record<string, any>;
    initialUserMapByName: Record<string, any>;
}

export default function SearchForumTab({
    query,
    initialPosts,
    initialTotal,
    initialUserMapById,
    initialUserMapByName,
}: SearchForumTabProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);
    const [userMapById, setUserMapById] = useState(initialUserMapById);
    const [userMapByName, setUserMapByName] = useState(initialUserMapByName);
    const [loading, setLoading] = useState(false);

    const loadMorePosts = async () => {
        if (loading) return;

        setLoading(true);
        try {
            const result = await getSearchResults(query, "forum", posts.length, 20);

            if (result.results.length === 0) {
                setHasMore(false);
            } else {
                setPosts((prevPosts) => [...prevPosts, ...result.results]);
                setHasMore(result.hasMore);
            }

            // Merge user maps
            setUserMapById((prev) => ({ ...prev, ...result.userMapById }));
            setUserMapByName((prev) => ({ ...prev, ...result.userMapByName }));
        } catch (error) {
            console.error("Error loading more posts:", error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    if (posts.length === 0 && !hasMore) {
        return (
            <div className="text-center text-neutral-400 py-8">
                Geen posts gevonden voor "{query}".
            </div>
        );
    }

    return (
        <div className="rounded-md overflow-hidden">
            <InfiniteScroll
                dataLength={posts.length}
                next={loadMorePosts}
                hasMore={hasMore}
                loader={
                    <div className="text-center p-4 bg-neutral-800 border border-neutral-700">
                        Laden...
                    </div>
                }
                scrollThreshold={0.8}
                style={{ overflow: "visible" }}
            >
                <div className="border border-neutral-700 rounded-md overflow-hidden bg-neutral-800">
                    {posts.map((post) => {
                        const creatorId = typeof post.creator === "string"
                            ? post.creator
                            : String(post.creator);
                        const user = userMapById[creatorId] || userMapByName[creatorId];
                        const subjectIcon = icons[post.subject as keyof typeof icons];
                        const subjectLabel = getSubjectName(post.subject) || post.subject;
                        const relativeTime = formatRelativeTime(post.createdAt);
                        const isReply = post.isReply === true;

                        let category = "";
                        let catBagdeColor = "";
                        let categoryIcon;
                        switch (post.category) {
                            case "school":
                                category = "School-gerelateerd";
                                catBagdeColor = "bg-blue-500";
                                categoryIcon = <Book />;
                                break;
                            case "general":
                                category = "Niet school-gerelateerd";
                                catBagdeColor = "bg-green-500";
                                categoryIcon = <MessageCircle />;
                                break;
                            case "help":
                                category = "Hulp";
                                catBagdeColor = "bg-yellow-500";
                                categoryIcon = <MessageCircleQuestion />;
                                break;
                            case "announcement":
                                category = "Aankondiging";
                                catBagdeColor = "bg-red-500";
                                categoryIcon = <Megaphone />;
                                break;
                        }

                        return (
                            <div key={post.post_id} className="relative">
                                <Link
                                    href={`/home/forum/${isReply ? post.replyTo : post.post_id}`}
                                    className="block"
                                >
                                    <div
                                        className={`border-b border-neutral-700 last:border-b-0 p-4 hover:bg-neutral-700 transition-all flex items-start sm:items-center cursor-pointer`}
                                    >
                                        <div className="mr-4 flex-shrink-0">
                                            {user?.image ? (
                                                <img
                                                    src={user.image}
                                                    alt={`de profielfoto van ${user.name || "iemand"}`}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full"
                                                />
                                            ) : (
                                                <Jdenticon
                                                    value={user?.name || post.creator}
                                                    size={40}
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="text-xs text-gray-400 mb-1 flex flex-wrap items-center gap-1">
                                                {post.category && (
                                                    <>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-xs ${catBagdeColor}`}
                                                        >
                                                            {categoryIcon}
                                                            {category}
                                                        </Badge>
                                                        <span className="mx-1.5">•</span>
                                                    </>
                                                )}
                                                {subjectIcon && (
                                                    <Image
                                                        src={subjectIcon}
                                                        alt={subjectLabel}
                                                        width={16}
                                                        height={16}
                                                        className="mr-1"
                                                    />
                                                )}
                                                {post.subject && (
                                                    <>
                                                        <span>{subjectLabel}</span>
                                                        <span className="mx-1.5">•</span>
                                                    </>
                                                )}
                                                <span className="text-gray-500">{relativeTime}</span>
                                                <span className="mx-1.5">•</span>
                                                <span className="text-gray-500 truncate">
                                                    Door: {user?.name || post.creator}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-lg break-words">
                                                {isReply ? (
                                                    <>
                                                        <span className="text-gray-400 font-normal text-sm">
                                                            Antwoord op:{" "}
                                                        </span>
                                                        {post.title}
                                                    </>
                                                ) : (
                                                    post.title
                                                )}
                                            </h3>
                                            {isReply && (
                                                <p className="text-sm text-gray-300 mt-1 line-clamp-2 break-words">
                                                    {post.content.length > 100
                                                        ? `${post.content.substring(0, 100)}...`
                                                        : post.content}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </InfiniteScroll>
        </div>
    );
}
