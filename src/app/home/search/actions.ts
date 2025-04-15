'use server'

import { prisma } from '@/utils/prisma';

export async function searchContent(query: string) {
    if (!query) {
        return { lists: [], forumPosts: [] };
    }

    try {
        // Search for lists
        const lists = await prisma.practice.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { creator: { contains: query, mode: 'insensitive' } },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // Search for forum posts
        const forumPosts = await prisma.forum.findMany({
            where: {
                type: 'thread',
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { content: { contains: query, mode: 'insensitive' } },
                    { creator: { contains: query, mode: 'insensitive' } },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // Get unique creator IDs from forum posts
        const creatorIds = [...new Set(forumPosts.map(post => post.creator))];

        // Look up usernames for these IDs
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { id: { in: creatorIds } },
                    { name: { in: creatorIds } } // Also check if any creator value is actually a username
                ]
            },
            select: {
                id: true,
                name: true
            }
        });

        // Create a lookup map of user IDs to usernames
        const userMap = users.reduce((map, user) => {
            if (user.id) map[user.id] = user.name || 'Onbekend';
            return map;
        }, {} as Record<string, string>);

        // Enhance forum posts with creator usernames
        const enhancedForumPosts = forumPosts.map(post => ({
            ...post,
            creatorName: userMap[post.creator] || post.creator // Fallback to ID if no username found
        }));

        return { lists, forumPosts: enhancedForumPosts };
    } catch (error) {
        console.error('Search error:', error);
        return { lists: [], forumPosts: [], error: 'Failed to perform search' };
    }
}
