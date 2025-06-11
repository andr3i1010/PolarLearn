"use server";

import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";

type TabType = "questions" | "my-questions" | "my-answers";

export async function getPosts(tab: TabType, skip: number, take: number) {
  const session = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );

  // Get the user's ID for queries
  const userId = session?.id;
  const userName = session?.name;

  let posts = [];
  let total = 0;

  try {
    switch (tab) {
      case "questions":
        // Always fetch pinned threads and paginated non-pinned threads
        const pinnedPosts = await prisma.forum.findMany({
          where: { type: "thread", pinned: true },
          orderBy: { createdAt: "desc" },
          select: {
            post_id: true,
            title: true,
            content: true,
            creator: true,
            createdAt: true,
            subject: true,
            category: true,
            votes: true,
            pinned: true,
            type: true,
            votes_data: true,
          }
        });
        const pinnedCount = pinnedPosts.length;
        // Calculate skip for non-pinned threads
        const nonPinnedSkip = Math.max(0, skip - pinnedCount);
        // Fetch paginated non-pinned threads and total thread count concurrently
        const [nonPinnedPosts, totalThreads] = await Promise.all([
          prisma.forum.findMany({
            where: { type: "thread", pinned: false },
            orderBy: { createdAt: "desc" },
            skip: nonPinnedSkip,
            take,
            select: {
              post_id: true,
              title: true,
              content: true,
              creator: true,
              createdAt: true,
              subject: true,
              category: true,
              votes: true,
              pinned: true,
              type: true,
              votes_data: true,
            }
          }),
          prisma.forum.count({ where: { type: "thread" } }),
        ]);
        // Combine pinned posts on the first page only
        posts = skip === 0 ? [...pinnedPosts, ...nonPinnedPosts] : nonPinnedPosts;
        total = totalThreads;
        break;

      case "my-questions":
        if (!userId && !userName) {
          return {
            posts: [],
            total: 0,
            userMapById: {},
            userMapByName: {},
            hasMore: false,
          };
        }

        // Fetch user's questions with flexible matching - check both ID and name
        [posts, total] = await Promise.all([
          prisma.forum.findMany({
            where: {
              type: "thread",
              OR: [{ creator: userId }, { creator: userName as string }],
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: {
              post_id: true,
              title: true,
              content: true,
              creator: true,
              createdAt: true,
              subject: true,
              category: true,
              votes: true,
              pinned: true,
              type: true,
              votes_data: true,
            }
          }),
          prisma.forum.count({
            where: {
              type: "thread",
              OR: [{ creator: userId }, { creator: userName as string }],
            },
          }),
        ]);
        break;

      case "my-answers":
        if (!userId && !userName) {
          return {
            posts: [],
            total: 0,
            userMapById: {},
            userMapByName: {},
            hasMore: false,
          };
        }

        // Fetch user's answers - also check both ID and name
        const [replies, repliesTotal] = await Promise.all([
          prisma.forum.findMany({
            where: {
              type: "reply",
              OR: [{ creator: userId }, { creator: userName as string }],
            },
            orderBy: { createdAt: "desc" },
            select: {
              post_id: true,
              replyTo: true,
              content: true,
              creator: true,
              createdAt: true,
              subject: true,
              category: true,
            },
            skip,
            take,
          }),
          prisma.forum.count({
            where: {
              type: "reply",
              OR: [{ creator: userId }, { creator: userName as string }],
            },
          }),
        ]);

        if (replies.length === 0) {
          return {
            posts: [],
            total: repliesTotal,
            userMapById: {},
            userMapByName: {},
            hasMore: false,
          };
        }

        // Get the parent thread information for context
        const parentIds = replies
          .map((reply) => reply.replyTo)
          .filter(Boolean) as string[];

        if (parentIds.length === 0) {
          return {
            posts: [],
            total: repliesTotal,
            userMapById: {},
            userMapByName: {},
            hasMore: false,
          };
        }

        const parentThreads = await prisma.forum.findMany({
          where: {
            post_id: {
              in: parentIds,
            },
          },
          select: {
            post_id: true,
            title: true,
          },
        });

        // Create a map of parent thread titles for quick lookup
        const parentThreadMap = parentThreads.reduce((acc, thread) => {
          acc[thread.post_id] = thread.title;
          return acc;
        }, {} as Record<string, string>);

        // Enhance the reply objects with parent thread titles
        posts = replies.map((reply) => ({
          ...reply,
          title: parentThreadMap[reply.replyTo || ""] || "Onbekende thread",
          isReply: true, // Flag to identify this as a reply for UI handling
        }));

        total = repliesTotal;
        break;
    }

    // If no posts were found, return early
    if (posts.length === 0) {
      return {
        posts: [],
        total,
        userMapById: {},
        userMapByName: {},
        hasMore: false,
      };
    }

    // Get unique creator IDs from all forum posts
    const creatorIds = [
      ...new Set(
        posts.filter((post) => "creator" in post).map((post) => post.creator)
      ),
    ];

    // Fetch users by ID and name
    const users = await prisma.user.findMany({
      where: {
        OR: [{ id: { in: creatorIds } }, { name: { in: creatorIds } }],
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    // Create maps for both ID and name lookups
    const userMapById = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, any>);

    const userMapByName = users.reduce((acc, user) => {
      if (user.name) acc[user.name] = user;
      return acc;
    }, {} as Record<string, any>);

    return {
      posts,
      total,
      userMapById,
      userMapByName,
      hasMore: skip + posts.length < total,
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return {
      posts: [],
      total: 0,
      userMapById: {},
      userMapByName: {},
      hasMore: false,
    };
  }
}
