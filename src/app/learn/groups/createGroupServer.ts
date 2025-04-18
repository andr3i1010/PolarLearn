"use server";

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/utils/prisma';
import { cookies } from 'next/headers';
import { getUserFromSession } from '@/utils/auth/auth';
import { revalidatePath } from 'next/cache';

export async function createGroupAction({
    name,
    description,
    everyoneCanAddLists,
    isPublic
}: {
    name: string;
    description?: string;
    everyoneCanAddLists: boolean;
    isPublic: boolean;
}) {
    try {
        const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

        if (!session || !session.name) {
            return { success: false, error: "Je moet ingelogd zijn om een groep aan te maken" };
        }

        const groupId = uuidv4();

        // Create the group
        const group = await prisma.group.create({
            data: {
                groupId,
                name,
                description: description || "",
                everyoneCanAddLists,
                requiresApproval: !isPublic,
                creator: session.id,
                members: [session.id], // Use array of user IDs
                admins: [session.id],  // Use array of user IDs
                listsAdded: []
            }
        });

        // Update the user's ownGroups field
        const user = await prisma.user.findUnique({
            where: { id: session.id }
        });

        if (user) {
            // Update user's ownGroups field
            const ownGroups = (user.ownGroups as string[]) || [];

            // Update user's inGroups field - groups they're members of
            const inGroups = (user.inGroups as string[]) || [];

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    ownGroups: [...ownGroups, groupId],
                    inGroups: [...inGroups, groupId]
                }
            });
        }

        // Revalidate all relevant paths
        revalidatePath('/learn/groups');
        revalidatePath('/learn/group/${groupId}');
        revalidatePath('/home/start');

        return { success: true, groupId };
    } catch (error) {
        console.error("Error creating group:", error);
        return { success: false, error: "Er is een fout opgetreden bij het aanmaken van de groep" };
    }
}

// Original createGroup function for backward compatibility
export async function createGroup(
    name: string,
    description?: string,
    isPublic: boolean = true,
    everyoneCanAddLists: boolean = false
) {
    const result = await createGroupAction({
        name,
        description,
        everyoneCanAddLists,
        isPublic
    });

    if (result.success) {
        return result.groupId;
    } else {
        throw new Error(result.error || "Failed to create group");
    }
}