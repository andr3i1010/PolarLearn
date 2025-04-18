import { prisma } from "@/utils/prisma"
import Image from "next/image"
import Jdenticon from "@/components/Jdenticon"
import { formatRelativeTime } from "@/utils/formatRelativeTime"
import VoteButtons from "@/components/VoteButtons"
import { getUserFromSession } from "@/utils/auth/auth"
import ForumReply from "@/components/ForumReply"
import DeletePostButton from "@/components/DeletePostButton"
import MarkdownRenderer from "@/components/md"
import { cookies } from "next/headers"
import CreatorLink from "@/components/links/CreatorLink"
import ForumHome from "../page"
import { Key } from "react"
import { getUserNameById } from "@/serverActions/getUserName"

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Define the structure for vote data
interface VoteData {
    users: Record<string, "up" | "down" | null>;
}

export default async function Page({
    params,
}: {
    params: Promise<{ postId: string }>
}) {
    const { postId } = await params;
    // If postId is actually a tab identifier, delegate to ForumHome
    if (
        ["questions", "my-questions", "my-answers", "how-the-forum-works"].includes(postId)
    ) {
        return <ForumHome searchParams={Promise.resolve({})} params={{ tab: [postId] }} />;
    }

    const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string)
    const currentUsername = session?.name || null

    const post = await prisma.forum.findUnique({
        where: {
            post_id: postId
        }
    })

    if (!post) {
        return <div>Post not found</div>
    }

    // Check if post creator is a UUID and get the proper display name if needed
    let jdenticonPostValue = post.creator;
    if (UUID_REGEX.test(post.creator)) {
        const userInfo = await getUserNameById(post.creator);
        if (userInfo.jdenticonValue) {
            jdenticonPostValue = userInfo.jdenticonValue;
        }
    }

    // Fetch replies to this post
    const replies = await prisma.forum.findMany({
        where: {
            type: "reply",
            replyTo: postId
        },
        orderBy: {
            createdAt: 'asc'
        }
    })

    // Process replies to get Jdenticon values for creators that are UUIDs
    const repliesWithJdenticonValues = await Promise.all(replies.map(async (reply) => {
        let jdenticonValue = reply.creator;
        if (UUID_REGEX.test(reply.creator)) {
            const userInfo = await getUserNameById(reply.creator);
            if (userInfo.jdenticonValue) {
                jdenticonValue = userInfo.jdenticonValue;
            }
        }
        return { ...reply, jdenticonValue };
    }));

    // Get list of creator identifiers (may be usernames or IDs)
    const creatorIdentifiers = [post.creator, ...replies.map((reply: { creator: any }) => reply.creator)]

    // Try to fetch users by ID first
    const usersById = await prisma.user.findMany({
        where: {
            id: { in: creatorIdentifiers as string[] }
        }
    })

    // If users weren't found by ID, try by name (in case creator stores username)
    const usersByName = await prisma.user.findMany({
        where: {
            name: { in: creatorIdentifiers as string[] }
        }
    })

    // Create a combined map using both id and name as keys
    const userMap: Record<string, any> = {};

    // Map users by ID
    usersById.forEach((user: { id: string | number }) => {
        if (user.id) userMap[user.id] = user;
    });

    // Map users by name
    usersByName.forEach((user: { name: string | null }) => {
        if (user.name) userMap[user.name] = user;
    });

    // Get post creator - try direct lookup or find by name
    const postcreator = userMap[post.creator] ||
        usersById.find((u: { id: any }) => u.id === post.creator) ||
        usersByName.find((u: { name: any }) => u.name === post.creator);

    // Check if current user is the post creator, using multiple checks
    const isPostCreator = currentUsername === post.creator ||
        (postcreator?.name && currentUsername === postcreator.name);

    // Get user's current vote if logged in
    let userVote: "up" | "down" | null = null;

    if (session?.name && post.votes_data) {
        // Safely access vote data
        const votesData = post.votes_data as unknown;

        // Check if it's an object with a users property
        if (
            votesData &&
            typeof votesData === 'object' &&
            'users' in votesData &&
            votesData.users &&
            typeof votesData.users === 'object'
        ) {
            const typedVotesData = votesData as VoteData;
            userVote = typedVotesData.users[session.name] || null;
        }
    }

    const relativeTime = formatRelativeTime(post.createdAt);

    return (
        <div className="px-4 py-4">
            <div className="flex items-center mb-6">
                <div className="mr-4">
                    {postcreator?.image ? (
                        <Image
                            src={postcreator.image}
                            alt={`de profielfoto van ${postcreator.name || 'iemand'}`}
                            width={48}
                            height={48}
                            className="rounded-full"
                        />
                    ) : (
                        <Jdenticon
                            value={jdenticonPostValue}
                            size={48}
                        />
                    )}
                </div>
                <div className="flex-grow">
                    <CreatorLink creator={postcreator?.name || post.creator} color="white" />
                    <p className="text-sm text-gray-400">{relativeTime}</p>
                </div>
                <div className="flex items-center gap-2">
                    {isPostCreator && (
                        <DeletePostButton
                            postId={post.post_id}
                            isCreator={true}  // Force to true since we already checked
                            isMainPost={true}
                        />
                    )}
                    <VoteButtons postId={post.post_id} initialVotes={post.votes} initialUserVote={userVote} user={session} />
                </div>
            </div>

            <h1 className="text-3xl mb-4 font-bold">{post.title}</h1>
            <hr className="flex-grow border-neutral-600 pb-4" />
            <div className="prose prose-invert max-w-none whitespace-pre-line">
                <MarkdownRenderer content={post.content} />
            </div>
            <div className="mt-6">
                <ForumReply postId={post.post_id} />
            </div>

            {repliesWithJdenticonValues.length > 0 && (
                <div className="mt-10">
                    <h2 className="text-xl font-bold mb-4">Antwoorden ({repliesWithJdenticonValues.length})</h2>
                    <div className="flex flex-col">
                        {repliesWithJdenticonValues.map((reply: { creator: string | number; createdAt: Date; votes_data: unknown; post_id: Key | null | undefined; votes: number; content: string, jdenticonValue: string }, index: number) => {
                            const replyCreator = userMap[reply.creator] ||
                                usersById.find((u: { id: any }) => u.id === reply.creator) ||
                                usersByName.find((u: { name: any }) => u.name === reply.creator);
                            const replyTime = formatRelativeTime(reply.createdAt);

                            // Check if current user is the reply creator - more flexible check
                            const isReplyCreator = currentUsername === reply.creator ||
                                (replyCreator?.name && currentUsername === replyCreator.name);
                            // Get user's vote on this reply
                            let replyUserVote: "up" | "down" | null = null;

                            if (session?.name && reply.votes_data) {
                                const replyVotesData = reply.votes_data as unknown;

                                if (
                                    replyVotesData &&
                                    typeof replyVotesData === 'object' &&
                                    'users' in replyVotesData &&
                                    replyVotesData.users &&
                                    typeof replyVotesData.users === 'object'
                                ) {
                                    const typedReplyVotesData = replyVotesData as VoteData;
                                    replyUserVote = typedReplyVotesData.users[session.name] || null;
                                }
                            }

                            // Determine border radius based on position
                            const isFirst = index === 0;
                            const isLast = index === repliesWithJdenticonValues.length - 1;

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
                                                    alt={`de profielfoto van ${replyCreator.name || 'iemand'}`}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full"
                                                />
                                            ) : (
                                                <Jdenticon
                                                    value={reply.jdenticonValue}
                                                    size={40}
                                                />
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <CreatorLink creator={replyCreator?.name || reply.creator} color="white" />
                                            <p className="text-sm text-gray-400">{replyTime}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isReplyCreator && reply.post_id && (
                                                <DeletePostButton
                                                    postId={String(reply.post_id)}
                                                    isCreator={true}  // Force to true since we already checked
                                                    isMainPost={false}
                                                />
                                            )}
                                            <VoteButtons postId={String(reply.post_id)} initialVotes={reply.votes} initialUserVote={replyUserVote} user={session} />
                                        </div>
                                    </div>
                                    <div className="prose prose-invert max-w-none whitespace-pre-line">
                                        <MarkdownRenderer content={reply.content} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}