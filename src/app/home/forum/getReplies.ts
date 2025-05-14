"use server";

import { prisma } from "@/utils/prisma";
import { getUserNameById } from "@/serverActions/getUserName";

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getReplies(postId: string, skip: number, take: number) {
    try {
        // Fetch paginated replies
        const replies = await prisma.forum.findMany({
            where: {
                type: "reply",
                replyTo: postId,
            },
            orderBy: {
                createdAt: "asc",
            },
            skip,
            take,
        });

        // Count total replies for this post
        const totalReplies = await prisma.forum.count({
            where: {
                type: "reply",
                replyTo: postId,
            },
        });

        // Get list of creator identifiers
        const creatorIdentifiers = replies.map(reply => reply.creator);

        // Process replies to get Jdenticon values for creators that are UUIDs
        const repliesWithJdenticonValues = await Promise.all(
            replies.map(async (reply) => {
                let jdenticonValue = reply.creator;
                if (UUID_REGEX.test(reply.creator)) {
                    const userInfo = await getUserNameById(reply.creator);
                    if (userInfo.jdenticonValue) {
                        jdenticonValue = userInfo.jdenticonValue;
                    }
                }
                return { ...reply, jdenticonValue };
            })
        );

        // Fetch users by ID and name
        const usersById = await prisma.user.findMany({
            where: {
                id: { in: creatorIdentifiers as string[] },
            },
        });

        const usersByName = await prisma.user.findMany({
            where: {
                name: { in: creatorIdentifiers as string[] },
            },
        });

        // Create a combined map using both id and name as keys
        const userMap: Record<string, any> = {};

        // Map users by ID
        usersById.forEach((user) => {
            if (user.id) userMap[user.id] = user;
        });

        // Map users by name
        usersByName.forEach((user) => {
            if (user.name) userMap[user.name] = user;
        });

        return {
            replies: repliesWithJdenticonValues,
            total: totalReplies,
            userMap,
            hasMore: skip + replies.length < totalReplies,
        };
    } catch (error) {
        console.error("Error fetching replies:", error);
        return {
            replies: [],
            total: 0,
            userMap: {},
            hasMore: false,
        };
    }
}
