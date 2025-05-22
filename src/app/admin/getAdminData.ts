"use server";

import { prisma } from "@/utils/prisma";

type TabType = "gebruikers" | "lijsten" | "groepen";

export async function getAdminData(tab: TabType, skip: number, take: number) {
  let data = [];
  let total = 0;
  let userMapById = {};

  try {
    switch (tab) {
      case "gebruikers":
        // Fetch users
        [data, total] = await Promise.all([
          prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take,
          }),
          prisma.user.count(),
        ]);
        break;

      case "lijsten":
        // Fetch lists
        [data, total] = await Promise.all([
          prisma.practice.findMany({
            orderBy: {
              createdAt: "desc",
            },
            skip,
            take,
          }),
          prisma.practice.count(),
        ]);

        // Get creator information
        const creatorIds = [...new Set([...data].map((post) => post.creator))];
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

        // Create user map by ID
        userMapById = users.reduce(
          (acc: Record<string, any>, user: any) => {
            acc[user.id] = user;
            return acc;
          },
          {} as Record<string, any>
        );
        break;

      case "groepen":
        // Fetch groups
        [data, total] = await Promise.all([
          prisma.group.findMany({
            orderBy: {
              createdAt: "desc",
            },
            skip,
            take,
          }),
          prisma.group.count(),
        ]);

        // Get creator information
        const groupCreatorIds = [...new Set([...data].map((group) => group.creator))];
        const groupUsers = await prisma.user.findMany({
          where: {
            OR: [{ id: { in: groupCreatorIds } }, { name: { in: groupCreatorIds } }],
          },
          select: {
            id: true,
            name: true,
            image: true,
          },
        });

        // Create user map by ID
        userMapById = groupUsers.reduce(
          (acc: Record<string, any>, user: any) => {
            acc[user.id] = user;
            return acc;
          },
          {} as Record<string, any>
        );
        break;
    }

    return { 
      data, 
      total, 
      userMapById, 
      hasMore: data.length + skip < total 
    };
  } catch (error) {
    console.error(`Error fetching ${tab}:`, error);
    return { 
      data: [], 
      total: 0, 
      userMapById: {}, 
      hasMore: false 
    };
  }
}
