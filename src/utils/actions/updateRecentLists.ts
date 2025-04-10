'use server';

import { prisma } from "@/utils/prisma";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/utils/auth/auth";

export async function addToRecentLists(listId: string) {
    const user = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);
    if (!user) return;

    // Update user's recent_lists array
    const account = await prisma.user.findUnique({
        where: { id: user.id }
    });

    const listData = account?.list_data as any || {};
    const recentLists = Array.isArray(listData.recent_lists) ? listData.recent_lists : [];

    // If the list is already at position 0, no need to update
    if (recentLists[0] === listId) {
        return;
    }

    // Remove the list if it already exists to avoid duplicates
    const updatedRecentLists = recentLists.filter((id: string) => id !== listId);

    // Check if anything changed - only update if needed
    const needsUpdate = recentLists.length !== updatedRecentLists.length ||
        recentLists[0] !== listId;

    if (!needsUpdate) {
        console.log(`No update needed for recent lists.`);
        return;
    }

    // Add the new list at the beginning (most recent)
    updatedRecentLists.unshift(listId);

    // Keep only a limited number of recent lists (e.g., 10)
    const limitedRecentLists = updatedRecentLists.slice(0, 10);

    console.log(`Updating recent lists: ${limitedRecentLists.slice(0, 3).join(', ')}...`);

    // Update the user record
    await prisma.user.update({
        where: { id: user.id },
        data: {
            list_data: {
                ...listData,
                recent_lists: limitedRecentLists
            }
        }
    });
}
