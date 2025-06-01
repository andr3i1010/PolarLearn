"use server";

import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";

type SearchTabType = "lists" | "forum" | "groups" | "summaries";

export async function getSearchResults(query: string, tab: SearchTabType, skip: number, take: number) {
    const session = await getUserFromSession(
        (await cookies()).get("polarlearn.session-id")?.value as string
    );

    // Get current user for permission checks if needed
    const currentUserName = session?.name;

    // Escape regex special characters in the query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let results: any[] = [];
    let total = 0;

    try {
        switch (tab) {
            case "lists":
                // Fetch lists matching the query
                [results, total] = await Promise.all([
                    prisma.practice.findMany({
                        where: {
                            published: true,
                            mode: "list",
                            OR: [
                                { name: { contains: escapedQuery, mode: 'insensitive' } },
                                { subject: { contains: escapedQuery, mode: 'insensitive' } },
                                { creator: { contains: escapedQuery, mode: 'insensitive' } },
                            ],
                        },
                        select: { list_id: true, name: true, subject: true, creator: true, data: true },
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take,
                    }),
                    prisma.practice.count({
                        where: {
                            published: true,
                            OR: [
                                { name: { contains: escapedQuery, mode: 'insensitive' } },
                                { subject: { contains: escapedQuery, mode: 'insensitive' } },
                                { creator: { contains: escapedQuery, mode: 'insensitive' } },
                            ],
                        },
                    }),
                ]);
                break;

            case "forum":
                // Fetch forum posts matching the query
                [results, total] = await Promise.all([
                    prisma.forum.findMany({
                        where: {
                            type: "thread",
                            OR: [
                                { title: { contains: escapedQuery, mode: 'insensitive' } },
                                { content: { contains: escapedQuery, mode: 'insensitive' } },
                                { subject: { contains: escapedQuery, mode: 'insensitive' } },
                                { creator: { contains: escapedQuery, mode: 'insensitive' } },
                            ],
                        },
                        select: { post_id: true, title: true, subject: true, creator: true, createdAt: true, content: true },
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take,
                    }),
                    prisma.forum.count({
                        where: {
                            type: "thread",
                            OR: [
                                { title: { contains: escapedQuery, mode: 'insensitive' } },
                                { content: { contains: escapedQuery, mode: 'insensitive' } },
                                { subject: { contains: escapedQuery, mode: 'insensitive' } },
                                { creator: { contains: escapedQuery, mode: 'insensitive' } },
                            ],
                        },
                    }),
                ]);
                break;

            case "groups":
                // Fetch groups matching the query
                [results, total] = await Promise.all([
                    prisma.group.findMany({
                        where: {
                            OR: [
                                { name: { contains: escapedQuery, mode: 'insensitive' } },
                                { description: { contains: escapedQuery, mode: 'insensitive' } },
                            ],
                        },
                        select: {
                            groupId: true,
                            name: true,
                            description: true,
                            members: true,
                            listsAdded: true,
                            creator: true,
                            requiresApproval: true
                        },
                        orderBy: { updatedAt: 'desc' },
                        skip,
                        take,
                    }),
                    prisma.group.count({
                        where: {
                            OR: [
                                { name: { contains: escapedQuery, mode: 'insensitive' } },
                                { description: { contains: escapedQuery, mode: 'insensitive' } },
                            ],
                        },
                    }),
                ]);
                break;
            case "summaries":
                [results, total] = await Promise.all([
                    prisma.practice.findMany({
                        where: {
                            published: true,
                            mode: "summary",
                            OR: [
                                { name: { contains: escapedQuery, mode: 'insensitive' } },
                                { subject: { contains: escapedQuery, mode: 'insensitive' } },
                                { creator: { contains: escapedQuery, mode: 'insensitive' } },
                            ],
                        },
                        select: { list_id: true, name: true, subject: true, creator: true, data: true },
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take,
                    }),
                    prisma.practice.count({
                        where: {
                            published: true,
                            OR: [
                                { name: { contains: escapedQuery, mode: 'insensitive' } },
                                { subject: { contains: escapedQuery, mode: 'insensitive' } },
                                { creator: { contains: escapedQuery, mode: 'insensitive' } },
                            ],
                        },
                    }),
                ]);
        }

        // If no results were found, return early
        if (results.length === 0) {
            return {
                results: [],
                total,
                userMapById: {},
                userMapByName: {},
                hasMore: false,
            };
        }

        // Extract creator IDs from the results
        let creatorIds: string[] = [];

        creatorIds = [
            ...new Set(
            results.filter((item: any) => "creator" in item).map((item: any) => item.creator)
            ),
        ];

        // Fetch user info for creators
        const users = await prisma.user.findMany({
            where: {
                OR: [{ id: { in: creatorIds } }, { name: { in: creatorIds } }],
            },
            select: { id: true, name: true, image: true },
        });

        // Create lookup maps by both ID and name
        const userMapById = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {} as Record<string, any>);

        const userMapByName = users.reduce((acc, user) => {
            if (user.name) acc[user.name] = user;
            return acc;
        }, {} as Record<string, any>);

        return {
            results,
            total,
            userMapById,
            userMapByName,
            hasMore: skip + results.length < total,
        };
    } catch (error) {
        console.error(`Error fetching ${tab} search results:`, error);
        return {
            results: [],
            total: 0,
            userMapById: {},
            userMapByName: {},
            hasMore: false,
        };
    }
}
