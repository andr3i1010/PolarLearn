"use server";

import { prisma } from '@/utils/prisma';
import { cookies } from 'next/headers';
import { getUserFromSession } from '@/utils/auth/auth';

export async function deleteListAction(listId: string) {
    const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

    if (!session || !session.name) {
        throw new Error("You must be logged in to delete a list");
    }

    // Get the list to ensure the current user is the creator
    const list = await prisma.practice.findFirst({
        where: {
            list_id: listId
        }
    });

    if (!list) {
        throw new Error("List not found");
    }

    // Check if the current user is the creator
    const isCreator = list.creator === session.name || list.creator === session.id;

    if (!isCreator) {
        // Try to find the user by ID to see if they match
        const user = await prisma.user.findUnique({
            where: { id: list.creator },
            select: { name: true }
        });

        if (user?.name !== session.name) {
            throw new Error("You can only delete your own lists");
        }
    }

    // Delete the list
    await prisma.practice.delete({
        where: {
            id: list.id
        }
    });

    // Update the user's list_data to remove this list from recent_lists and created_lists
    try {
        const userData = await prisma.user.findUnique({
            where: {
                name: session.name
            },
            select: {
                id: true,
                list_data: true
            }
        });

        if (userData && userData.list_data) {
            const listData = userData.list_data as any;

            // Filter out the deleted list from recent_lists
            if (listData.recent_lists && Array.isArray(listData.recent_lists)) {
                listData.recent_lists = listData.recent_lists.filter((id: string) => id !== listId);
            }

            // Filter out the deleted list from created_lists
            if (listData.created_lists && Array.isArray(listData.created_lists)) {
                listData.created_lists = listData.created_lists.filter((id: string) => id !== listId);
            }

            // Update the user record
            await prisma.user.update({
                where: {
                    id: userData.id
                },
                data: {
                    list_data: listData
                }
            });
        }
    } catch (error) {
        console.error("Error updating user data after list deletion:", error);
        // Continue with the function, as the list is already deleted
    }

    return { success: true };
}
