"use client";

import { useState } from "react";
import Image from "next/image";
import Jdenticon from "@/components/Jdenticon";
import DeletePostButton from "@/components/DeletePostButton";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import VoteButtons from "@/components/VoteButtons";
import ClientCreatorLink from "@/components/ClientCreatorLink";
import MarkdownRenderer from "@/components/md";
import InfiniteScroll from "react-infinite-scroll-component";
import { getReplies } from "./getReplies";
import EditReplyButton from "./editReplyBtn";

interface VoteData {
    users: Record<string, "up" | "down" | null>;
}

interface ForumRepliesListProps {
    postId: string;
    initialReplies: any[];
    initialTotal: number;
    initialUserMap: Record<string, any>;
    currentUser: any;
    mainPostTitle: string;
}

export default function ForumRepliesList({
    postId,
    initialReplies,
    initialTotal,
    initialUserMap,
    currentUser,
    mainPostTitle,
}: ForumRepliesListProps) {
    const [replies, setReplies] = useState(initialReplies);
    const [hasMore, setHasMore] = useState(initialReplies.length < initialTotal);
    const [userMap, setUserMap] = useState(initialUserMap);
    const [loading, setLoading] = useState(false);
    const currentUsername = currentUser?.name || null;

    const loadMoreReplies = async () => {
        if (loading) return;

        setLoading(true);
        try {
            const result = await getReplies(postId, replies.length, 10);

            if (result.replies.length === 0) {
                setHasMore(false);
            } else {
                setReplies((prevReplies) => [...prevReplies, ...result.replies]);
                setHasMore(result.hasMore);
            }

            // Merge user maps
            setUserMap((prev) => ({ ...prev, ...result.userMap }));
        } catch (error) {
            console.error("Error loading more replies:", error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    if (replies.length === 0 && !hasMore) {
        return null;
    }

    return (
        <div className="mt-10">
            <h2 className="text-xl font-bold mb-4">
                Antwoorden ({initialTotal})
            </h2>

            <InfiniteScroll
                dataLength={replies.length}
                next={loadMoreReplies}
                hasMore={hasMore}
                loader={
                    <div className="text-center p-4 border border-neutral-600 bg-neutral-800 my-2">
                        Laden...
                    </div>
                }
                scrollThreshold={0.8}
            >
                <div className="flex flex-col">
                    {replies.map((reply, index) => {
                        const replyCreator = userMap[reply.creator];
                        const replyTime = formatRelativeTime(reply.createdAt);

                        // Check if current user is the reply creator
                        const isReplyCreator =
                            currentUsername === reply.creator ||
                            (replyCreator?.name && currentUsername === replyCreator.name) ||
                            currentUser?.role === "admin";

                        // Check if current user is actually the creator (not just has delete permissions)
                        const isActualReplyCreator =
                            currentUsername === reply.creator ||
                            (replyCreator?.name && currentUsername === replyCreator.name);

                        // Get user's vote on this reply
                        let replyUserVote: "up" | "down" | null = null;

                        if (currentUsername && reply.votes_data) {
                            const replyVotesData = reply.votes_data as unknown;

                            if (
                                replyVotesData &&
                                typeof replyVotesData === "object" &&
                                "users" in replyVotesData &&
                                replyVotesData.users &&
                                typeof replyVotesData.users === "object"
                            ) {
                                const typedReplyVotesData = replyVotesData as VoteData;
                                replyUserVote = typedReplyVotesData.users[currentUsername] || null;
                            }
                        }

                        // Determine border radius based on position
                        const isFirst = index === 0;
                        const isLast = index === replies.length - 1 && !hasMore;

                        let replyClasses = "border border-neutral-600 bg-neutral-800 p-4";

                        if (isFirst && isLast) {
                            // If single reply, round all corners
                            replyClasses += " rounded-lg";
                        } else if (isFirst) {
                            // First reply - round top corners
                            replyClasses += " rounded-t-lg border-b-0";
                        } else if (isLast) {
                            // Last reply - round bottom corners
                            replyClasses += " rounded-b-lg";
                        } else {
                            // Middle reply - no rounded corners
                            replyClasses += " border-b-0";
                        }

                        return (
                            <div key={reply.post_id} className={replyClasses}>
                                <div className="flex items-center mb-4">
                                    <div className="mr-4">
                                        {replyCreator?.image ? (
                                            <Image
                                                src={replyCreator.image}
                                                alt={`de profielfoto van ${replyCreator.name || "iemand"
                                                    }`}
                                                width={40}
                                                height={40}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <Jdenticon value={reply.jdenticonValue} size={40} />
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <ClientCreatorLink
                                            creator={replyCreator?.name || reply.creator}
                                        />
                                        <div className="text-sm text-gray-400 flex flex-wrap gap-2">
                                            <span>{replyTime}</span>
                                            {reply.updatedAt && reply.createdAt &&
                                                new Date(reply.updatedAt).getTime() - new Date(reply.createdAt).getTime() > 1000 && (
                                                    <span>
                                                        • Bewerkt
                                                    </span>
                                                )
                                            }
                                            {replyCreator?.forumPoints !== undefined && (
                                                <span className="text-sm text-gray-400">• {replyCreator.forumPoints} {replyCreator.forumPoints === 1 ? 'punt' : 'punten'}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isReplyCreator && reply.post_id && (
                                            <>
                                                <EditReplyButton
                                                    postId={String(reply.post_id)}
                                                    isCreator={isActualReplyCreator}
                                                />
                                                <DeletePostButton
                                                    postId={String(reply.post_id)}
                                                    isCreator={isActualReplyCreator}
                                                    isMainPost={false}
                                                    title={mainPostTitle}
                                                    creatorId={reply.creator}
                                                    isAdmin={currentUser?.role === "admin"}
                                                />
                                            </>
                                        )}
                                        <VoteButtons
                                            postId={String(reply.post_id)}
                                            initialVotes={reply.votes}
                                            initialUserVote={replyUserVote}
                                            user={currentUser}
                                        />
                                    </div>
                                </div>
                                <div className="prose prose-invert max-w-none whitespace-pre-line">
                                    <MarkdownRenderer content={reply.content} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </InfiniteScroll>
        </div>
    );
}
