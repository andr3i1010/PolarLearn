"use server";

import { prisma } from '@/utils/prisma';
import { cookies } from 'next/headers';
import { getUserFromSession } from '@/utils/auth/auth';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

// Get lists that are part of a group
export async function getGroupLists(groupId: string) {
    try {
        const group = await prisma.group.findFirst({
            where: { groupId }
        });

        if (!group) {
            return [];
        }

        // Get the list IDs from the group's listsAdded field
        const listIds = (group.listsAdded as string[]) || [];

        if (listIds.length === 0) {
            return [];
        }

        // Fetch the actual list data
        const lists = await prisma.practice.findMany({
            where: {
                list_id: { in: listIds }
            }
        });

        return lists;
    } catch (error) {
        console.error("Error fetching group lists:", error);
        return [];
    }
}

// Get available lists that can be added to a group
export async function getAvailableLists(groupId: string) {
    try {
        const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

        if (!session || !session.name) {
            return { error: "Not authenticated", lists: [] };
        }

        // Get the group
        const group = await prisma.group.findFirst({
            where: { groupId }
        });

        if (!group) {
            return { error: "Group not found", lists: [] };
        }

        // Get lists already in the group
        const groupListIds = (group.listsAdded as string[]) || [];

        // Get the user's data - similar to how the home page does it
        const user = await prisma.user.findUnique({
            where: { id: session.id }
        });

        const listData = user?.list_data as any || {};

        // Get recently practiced lists - this array contains the IDs in order of recency
        const recentListIds = Array.isArray(listData.recent_lists)
            ? listData.recent_lists.filter(Boolean)
            : [];

        // Get user-created lists
        const createdListIds = Array.isArray(listData.created_lists)
            ? listData.created_lists.filter(Boolean)
            : [];

        // If the user hasn't practiced any lists yet
        if (recentListIds.length === 0 && createdListIds.length === 0) {
            // Offer some published lists as a fallback
            const suggestedLists = await prisma.practice.findMany({
                where: {
                    published: true,
                    list_id: { notIn: groupListIds }
                },
                take: 10,
                orderBy: { updatedAt: 'desc' }
            });

            return {
                success: true,
                lists: suggestedLists,
                message: "Hier zijn enkele gepubliceerde lijsten die je kunt toevoegen:"
            };
        }

        // Build the OR conditions properly to avoid TypeScript errors
        const orConditions = [];

        // Add condition for recent lists if we have any
        if (recentListIds.length > 0) {
            orConditions.push({
                list_id: { in: recentListIds }
            });
        }

        // Add condition for created lists if we have any
        if (createdListIds.length > 0) {
            orConditions.push({
                list_id: { in: createdListIds }
            });
        }

        // Always include user-created lists
        orConditions.push({
            creator: session.name
        });

        // Fetch recent and created lists, excluding those already in the group
        const userLists = await prisma.practice.findMany({
            where: {
                AND: [
                    // Not already in the group
                    { list_id: { notIn: groupListIds } },
                    {
                        OR: orConditions
                    }
                ]
            }
        });

        // Create a map for quick lookup of the list's position in recentListIds
        const recentListIdPositions = Object.fromEntries(
            recentListIds.map((id: string, index: number) => [id, index])
        );

        // Sort lists in the same order as recentListIds (recently practiced first)
        const sortedLists = [...userLists].sort((a, b) => {
            // First, check if both lists are in recentListIds
            const aInRecent = a.list_id in recentListIdPositions;
            const bInRecent = b.list_id in recentListIdPositions;

            if (aInRecent && bInRecent) {
                // Both lists are recently practiced, compare their positions
                return recentListIdPositions[a.list_id] - recentListIdPositions[b.list_id];
            } else if (aInRecent) {
                // Only a is recently practiced, so a comes first
                return -1;
            } else if (bInRecent) {
                // Only b is recently practiced, so b comes first
                return 1;
            } else {
                // Neither is recently practiced, fallback to updatedAt
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
        });

        return {
            success: true,
            lists: sortedLists
        };
    } catch (error) {
        console.error('Error getting available lists:', error);
        return {
            error: `Error: ${error}`,
            lists: []
        };
    }
}

// Add a list to a group
export async function addListToGroup(groupId: string, listId: string) {
    try {
        const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

        if (!session || !session.id) {
            throw new Error("Je moet ingelogd zijn om een lijst toe te voegen");
        }

        // Get the group
        const group = await prisma.group.findFirst({
            where: { groupId }
        });

        if (!group) {
            throw new Error("Groep niet gevonden");
        }

        // Check if user is a member or creator or admin
        const members = group.members as string[] || [];
        const isCreator = group.creator === session.id;
        const isAdmin = Array.isArray(group.admins) ? group.admins.includes(session.id) : false;
        const isMember = members.includes(session.id) || members.includes(session.name || '') || isCreator;

        if (!isMember) {
            throw new Error("Je moet lid zijn van deze groep om lijsten toe te voegen");
        }

        // Check if user can add lists
        const canAddLists = isCreator || isAdmin || group.everyoneCanAddLists === true;

        if (!canAddLists) {
            throw new Error("Je hebt geen rechten om lijsten toe te voegen");
        }

        // Check if list exists
        const list = await prisma.practice.findFirst({
            where: { list_id: listId }
        });

        if (!list) {
            throw new Error("Lijst niet gevonden");
        }

        // Check if list is already in the group
        const listIds = (group.listsAdded as string[]) || [];
        if (listIds.includes(listId)) {
            throw new Error("Deze lijst zit al in de groep");
        }

        // Add the list ID to the group's listsAdded field
        const updatedListIds = [...listIds, listId];

        // Update the group
        await prisma.group.update({
            where: { id: group.id },
            data: { listsAdded: updatedListIds }
        });

        revalidatePath(`/learn/group/${groupId}`);
        revalidatePath(`/learn/group/${groupId}/addlist`);
        return { success: true };
    } catch (error) {
        console.error("Error adding list to group:", error);
        throw error;
    }
}

// Add multiple lists to a group
export async function addListsToGroup(groupId: string, listIds: string[]) {
    try {
        const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

        if (!session || !session.name) {
            return { success: false, error: "Not authenticated" };
        }

        // Get the group
        const group = await prisma.group.findFirst({
            where: { groupId }
        });

        if (!group) {
            return { success: false, error: "Group not found" };
        }

        // Check if the user can add lists
        const members = group.members as string[] || [];
        const isCreator = group.creator === session.name;
        const isAdmin = Array.isArray(group.admins) ? group.admins.includes(session.name) : false;
        const isMember = members.includes(session.name) || isCreator;

        if (!isMember) {
            return { success: false, error: "You must be a member of this group to add lists" };
        }

        // Check permissions
        const canAddLists = isCreator || isAdmin || group.everyoneCanAddLists === true;

        if (!canAddLists) {
            return { success: false, error: "You don't have permission to add lists to this group" };
        }

        // Get existing list IDs in group
        const existingListIds = (group.listsAdded as string[]) || [];

        // Filter out any lists that are already in the group
        const newListIds = listIds.filter(id => !existingListIds.includes(id));

        if (newListIds.length === 0) {
            return { success: false, error: "These lists are already in the group" };
        }

        // Check if all lists exist
        const lists = await prisma.practice.findMany({
            where: { list_id: { in: newListIds } }
        });

        if (lists.length !== newListIds.length) {
            return { success: false, error: "Some lists could not be found" };
        }

        // Add the list IDs to the group's listsAdded field
        const updatedListIds = [...existingListIds, ...newListIds];

        // Update the group
        await prisma.group.update({
            where: { id: group.id },
            data: { listsAdded: updatedListIds }
        });

        revalidatePath(`/learn/group/${groupId}`);
        return { success: true, addedCount: newListIds.length };
    } catch (error) {
        console.error("Error adding lists to group:", error);
        return { success: false, error: "Failed to add lists to group" };
    }
}

// Remove a list from a group
export async function removeListFromGroup(groupId: string, listId: string) {
    try {
        const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

        if (!session || !session.name) {
            throw new Error("User not authenticated");
        }

        // Get the group
        const group = await prisma.group.findFirst({
            where: { groupId }
        });

        if (!group) {
            throw new Error("Group not found");
        }

        // Check if user is the creator or is the list creator
        const isCreator = group.creator === session.name;

        // Get the list to check the creator
        const list = await prisma.practice.findFirst({
            where: { list_id: listId }
        });

        if (!list) {
            throw new Error("List not found");
        }

        const isListCreator = list.creator === session.name;

        if (!isCreator && !isListCreator) {
            throw new Error("You must be the group creator or list creator to remove this list");
        }

        // Remove the list ID from the group's listsAdded field
        const listIds = (group.listsAdded as string[]) || [];
        const updatedListIds = listIds.filter(id => id !== listId);

        // Update the group
        await prisma.group.update({
            where: { id: group.id },
            data: { listsAdded: updatedListIds }
        });

        revalidatePath(`/learn/group/${groupId}`);
        return { success: true };
    } catch (error) {
        console.error("Error removing list from group:", error);
        throw error;
    }
}

// Create a new group
export async function createGroupAction({
    name,
    description,
    everyoneCanAddLists,
    isPublic = true
}: {
    name: string;
    description?: string;
    everyoneCanAddLists: boolean;
    isPublic?: boolean;
}) {
    try {
        const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

        if (!session || !session.name || !session.id) {
            return { success: false, error: "Je moet ingelogd zijn om een groep aan te maken" };
        }

        const groupId = uuidv4();

        // Create the group with proper structure
        const group = await prisma.group.create({
            data: {
                groupId,
                name,
                description: description || "",
                everyoneCanAddLists,
                requiresApproval: !isPublic,
                creator: session.id, // Store user ID as creator
                members: [session.id], // Add creator as first member (using ID)
                admins: [session.id], // Add creator as admin (using ID)
                listsAdded: []
            }
        });

        // Update the user's ownGroups and inGroups fields
        const user = await prisma.user.findUnique({
            where: { id: session.id }
        });

        if (user) {
            // Update ownGroups (groups the user has created)
            const ownGroups = (user.ownGroups as string[]) || [];

            // Update inGroups (groups the user is a member of)
            const inGroups = (user.inGroups as string[]) || [];

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    // Make sure the arrays don't contain duplicates
                    ownGroups: [...new Set([...ownGroups, groupId])],
                    inGroups: [...new Set([...inGroups, groupId])]
                }
            });
        }

        // Revalidate all related paths to ensure UI updates
        revalidatePath('/learn/groups');
        revalidatePath(`/learn/group/${groupId}`);
        revalidatePath('/home/start');

        return { success: true, groupId };
    } catch (error) {
        console.error("Error creating group:", error);
        return { success: false, error: "Er is een fout opgetreden bij het aanmaken van de groep" };
    }
}

// Update group settings
export async function updateGroupSettings({
    groupId,
    name,
    description,
    everyoneCanAddLists
}: {
    groupId: string;
    name: string;
    description?: string;
    everyoneCanAddLists: boolean;
}) {
    try {
        const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

        if (!session || !session.id) {
            return { success: false, error: "Je moet ingelogd zijn om een groep te bewerken" };
        }

        // Get the group
        const group = await prisma.group.findFirst({
            where: { groupId }
        });

        if (!group) {
            return { success: false, error: "Groep niet gevonden" };
        }

        // Check if user is creator or admin
        const isCreator = group.creator === session.id;
        const isAdmin = Array.isArray(group.admins) ? group.admins.includes(session.id) : false;

        if (!isCreator && !isAdmin) {
            return { success: false, error: "Je hebt geen rechten om deze groep te bewerken" };
        }

        // Update the group
        await prisma.group.update({
            where: { id: group.id },
            data: {
                name,
                description: description || "",
                everyoneCanAddLists
            }
        });

        revalidatePath(`/learn/group/${groupId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating group settings:", error);
        return { success: false, error: "Er is een fout opgetreden bij het bijwerken van de groep" };
    }
}

// Delete a group (creator only)
export async function deleteGroup(groupId: string) {
    try {
        const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

        if (!session || !session.id) {
            return { success: false, error: "Je moet ingelogd zijn om een groep te verwijderen" };
        }

        // Get the group
        const group = await prisma.group.findFirst({
            where: { groupId }
        });

        if (!group) {
            return { success: false, error: "Groep niet gevonden" };
        }

        // Check if user is creator (by id or name) or admin
        const isCreator = group.creator === session.id || group.creator === session.name || session?.role === 'admin';

        if (!isCreator) {
            return { success: false, error: "Alleen de eigenaar kan deze groep verwijderen" };
        }

        // Delete the group
        await prisma.group.delete({
            where: { id: group.id }
        });

        // Update owner's ownGroups array to remove this group
        const user = await prisma.user.findUnique({
            where: { id: session.id }
        });

        if (user) {
            const ownGroups = (user.ownGroups as string[]) || [];
            const updatedOwnGroups = ownGroups.filter(id => id !== groupId);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    ownGroups: updatedOwnGroups
                }
            });
        }
        revalidatePath('/learn/groups');
        return { success: true };
    } catch (error) {
        console.error("Error deleting group:", error);
        return { success: false, error: "Er is een fout opgetreden bij het verwijderen van de groep" };
    }
}

// Toggle admin status for a group member
export async function toggleMemberAdminStatus(groupId: string, memberId: string) {
    try {
        const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

        if (!session || !session.id) {
            return { success: false, error: "Je moet ingelogd zijn om beheerders aan te wijzen" };
        }

        // Get the group
        const group = await prisma.group.findFirst({
            where: { groupId }
        });

        if (!group) {
            return { success: false, error: "Groep niet gevonden" };
        }

        // Only the group creator can manage admins
        if (group.creator !== session.id) {
            return { success: false, error: "Alleen de eigenaar kan beheerders aanwijzen" };
        }

        // Check if the target user is a member
        const members = group.members as string[] || [];
        if (!members.includes(memberId)) {
            return { success: false, error: "Gebruiker is geen lid van deze groep" };
        }

        // Check if the target user is already an admin
        const admins = Array.isArray(group.admins) ? [...group.admins] : [];
        const isCurrentlyAdmin = admins.includes(memberId);

        // Toggle admin status
        let updatedAdmins: string[];
        if (isCurrentlyAdmin) {
            // Remove from admins
            updatedAdmins = admins.filter(id => id !== memberId);
        } else {
            // Add to admins
            updatedAdmins = [...admins, memberId];
        }

        // Update the group
        await prisma.group.update({
            where: { id: group.id },
            data: { admins: updatedAdmins }
        });

        revalidatePath(`/learn/group/${groupId}`);
        revalidatePath(`/learn/group/${groupId}/members`);

        return {
            success: true,
            isAdmin: !isCurrentlyAdmin,
            message: isCurrentlyAdmin
                ? "Gebruiker is geen beheerder meer"
                : "Gebruiker is nu een beheerder"
        };
    } catch (error) {
        console.error("Error toggling admin status:", error);
        return { success: false, error: "Er is een fout opgetreden bij het wijzigen van beheerdersrechten" };
    }
}

// Join a group
export async function joinGroup(groupId: string) {
    try {
        const session = await getUserFromSession(
            (await cookies()).get("polarlearn.session-id")?.value as string
        );

        if (!session) {
            return { success: false, error: "Je moet ingelogd zijn om lid te worden" };
        }

        // Get the group
        const group = await prisma.group.findUnique({
            where: { groupId },
        });

        if (!group) {
            return { success: false, error: "Groep niet gevonden" };
        }

        // Get current members and pending approvals
        const members = group.members ?
            (Array.isArray(group.members) ? group.members : []) : [];

        // Check if user is already a member
        if (members.includes(session.id)) {
            return { success: false, error: "Je bent al lid van deze groep" };
        }

        // Handle groups that require approval
        if (group.requiresApproval) {
            // Get current pending approvals
            let pendingApprovals: string[] = [];

            if (group.toBeApproved) {
                if (Array.isArray(group.toBeApproved)) {
                    pendingApprovals = group.toBeApproved as string[];
                } else if (typeof group.toBeApproved === 'object') {
                    pendingApprovals = Object.keys(group.toBeApproved as object);
                }
            }

            // Check if user already has a pending request
            if (pendingApprovals.includes(session.id)) {
                return {
                    success: false,
                    error: "Je hebt al een verzoek ingediend om lid te worden"
                };
            }

            // Add user to pending approvals
            const updatedPendingApprovals = [...pendingApprovals, session.id];

            await prisma.group.update({
                where: { groupId },
                data: { toBeApproved: updatedPendingApprovals }
            });

            return {
                success: true,
                message: "Je verzoek is ingediend en wacht op goedkeuring"
            };
        } else {
            // If no approval required, add user directly to members
            const updatedMembers = [...members, session.id];

            await prisma.group.update({
                where: { groupId },
                data: { members: updatedMembers }
            });

            // Update user's inGroups list
            const user = await prisma.user.findUnique({
                where: { id: session.id }
            });

            if (user) {
                const inGroups = (user.inGroups as string[]) || [];
                const updatedInGroups = [...new Set([...inGroups, groupId])];
                await prisma.user.update({
                    where: { id: session.id },
                    data: { inGroups: updatedInGroups }
                });
            }
            revalidatePath('/learn/groups');
            revalidatePath('/home/start');

            return { success: true, message: "Je bent nu lid van deze groep" };
        }
    } catch (error) {
        console.error("Error joining group:", error);
        return { success: false, error: "Er is een fout opgetreden" };
    }
}

// Leave a group
export async function leaveGroup(groupId: string) {
    try {
        const session = await getUserFromSession(
            (await cookies()).get("polarlearn.session-id")?.value as string
        );

        if (!session || !session.id) {
            return { success: false, error: "Je moet ingelogd zijn om een groep te verlaten" };
        }

        const group = await prisma.group.findUnique({
            where: { groupId },
        });

        if (!group) {
            return { success: false, error: "Groep niet gevonden" };
        }

        // Check if user is the creator
        if (group.creator === session.id) {
            return { success: false, error: "De eigenaar kan de groep niet verlaten. Verwijder de groep of draag het eigendom over." };
        }

        const members = (group.members as string[]) || [];
        const admins = (group.admins as string[]) || [];

        // Check if user is a member
        if (!members.includes(session.id)) {
            return { success: false, error: "Je bent geen lid van deze groep" };
        }

        // Remove user from members
        const updatedMembers = members.filter(id => id !== session.id);
        // Remove user from admins if they were an admin
        const updatedAdmins = admins.filter(id => id !== session.id);

        await prisma.group.update({
            where: { groupId },
            data: {
                members: updatedMembers,
                admins: updatedAdmins,
            },
        });

        // Update user's inGroups list
        const user = await prisma.user.findUnique({
            where: { id: session.id }
        });

        if (user) {
            const inGroups = (user.inGroups as string[]) || [];
            const updatedInGroups = inGroups.filter(id => id !== groupId);
            await prisma.user.update({
                where: { id: session.id },
                data: { inGroups: updatedInGroups }
            });
        }

        revalidatePath('/learn/groups');
        revalidatePath(`/learn/group/${groupId}`);
        revalidatePath('/home/start');

        return { success: true, message: "Je hebt de groep verlaten" };

    } catch (error) {
        console.error("Error leaving group:", error);
        return { success: false, error: "Er is een fout opgetreden bij het verlaten van de groep" };
    }
}

/**
 * Get users pending approval for a group
 */
export async function getPendingApprovals(groupId: string) {
    try {
        const session = await getUserFromSession(
            (await cookies()).get("polarlearn.session-id")?.value as string
        );

        if (!session) {
            return { success: false, error: "Je moet ingelogd zijn" };
        }

        // Get the group
        const group = await prisma.group.findUnique({
            where: { groupId },
        });

        if (!group) {
            return { success: false, error: "Groep niet gevonden" };
        }

        // Check if user is admin or creator
        const isAdmin = Array.isArray(group.admins) && group.admins.includes(session.id);
        const isCreator = group.creator === session.id;

        if (!isAdmin && !isCreator && session.role !== "admin") {
            return { success: false, error: "Je hebt geen toestemming om verzoeken te bekijken" };
        }

        // Get the pending approvals
        const pendingApprovals = group.toBeApproved || [];

        // If the field exists but is an empty array or empty object, return empty list
        if (Array.isArray(pendingApprovals) && pendingApprovals.length === 0 ||
            (typeof pendingApprovals === 'object' && Object.keys(pendingApprovals).length === 0)) {
            return { success: true, pendingApprovals: [] };
        }

        // Now fetch user details for each pending approval
        let userIds: string[] = [];

        if (Array.isArray(pendingApprovals)) {
            // Filter out non-string values and ensure we only have strings
            userIds = pendingApprovals
                .filter((id): id is string => typeof id === 'string')
                .map(id => id);
        } else {
            // If it's stored as an object with timestamps or additional data
            userIds = Object.keys(pendingApprovals);
        }

        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, image: true }
        });

        return {
            success: true,
            pendingApprovals: users
        };
    } catch (error) {
        console.error("Error getting pending approvals:", error);
        return { success: false, error: "Er is een fout opgetreden" };
    }
}

/**
 * Approve or reject a user's request to join a group
 */
export async function handleMembershipRequest(
    groupId: string,
    userId: string,
    approved: boolean
) {
    try {
        const session = await getUserFromSession(
            (await cookies()).get("polarlearn.session-id")?.value as string
        );

        if (!session) {
            return { success: false, error: "Je moet ingelogd zijn" };
        }

        // Get the group
        const group = await prisma.group.findUnique({
            where: { groupId },
        });

        if (!group) {
            return { success: false, error: "Groep niet gevonden" };
        }

        // Check if user is admin or creator
        const isAdmin = Array.isArray(group.admins) && group.admins.includes(session.id);
        const isCreator = group.creator === session.id;

        if (!isAdmin && !isCreator && session.role !== "admin") {
            return { success: false, error: "Je hebt geen toestemming om verzoeken te behandelen" };
        }

        // Get current members and pending approvals
        const members = group.members ?
            (Array.isArray(group.members) ? group.members : []) : [];

        let pendingApprovals: string[] = [];
        if (group.toBeApproved) {
            if (Array.isArray(group.toBeApproved)) {
                // Filter out non-string values and ensure we only have strings
                pendingApprovals = group.toBeApproved
                    .filter((id): id is string => typeof id === 'string')
                    .map(id => id);
            } else {
                // If it's stored as an object with timestamps or additional data
                pendingApprovals = Object.keys(group.toBeApproved);
            }
        }

        // Remove user from pending approvals
        const updatedPendingApprovals = pendingApprovals.filter(id => id !== userId);

        // Add user to members if approved
        let updatedMembers = [...members];
        if (approved && !updatedMembers.includes(userId)) {
            updatedMembers.push(userId);
        }

        // Update the group
        await prisma.group.update({
            where: { groupId },
            data: {
                members: updatedMembers,
                toBeApproved: updatedPendingApprovals
            }
        });

        return {
            success: true,
            message: approved ? "Gebruiker toegevoegd aan de groep" : "Verzoek afgewezen"
        };
    } catch (error) {
        console.error("Error handling membership request:", error);
        return { success: false, error: "Er is een fout opgetreden" };
    }
}

// Remove a member from a group
export async function removeMemberFromGroup(groupId: string, memberId: string) {
    try {
        const session = await getUserFromSession(
            (await cookies()).get("polarlearn.session-id")?.value as string
        );

        if (!session || !session.id) {
            return {
                success: false,
                error: "Je moet ingelogd zijn om deze actie uit te voeren",
            };
        }

        // Get the group
        const group = await prisma.group.findFirst({
            where: { groupId },
        });

        if (!group) {
            return {
                success: false,
                error: "Groep niet gevonden",
            };
        }

        // Check if current user is creator, admin, or platform admin
        const isCreator = group.creator === session.id;
        const isAdmin =
            (Array.isArray(group.admins) && group.admins.includes(session.id)) ||
            session.role === "admin";

        if (!isCreator && !isAdmin) {
            return {
                success: false,
                error: "Je hebt geen rechten om leden te verwijderen",
            };
        }

        // Check if target is the creator (creator can't be removed)
        if (group.creator === memberId) {
            return {
                success: false,
                error: "De eigenaar kan niet uit de groep worden verwijderd",
            };
        }

        // Prepare the updated members array
        const currentMembers = (group.members || []) as string[];
        const updatedMembers = currentMembers.filter(
            member => member !== memberId
        );

        // Update members list
        await prisma.group.update({
            where: { groupId },
            data: {
                members: updatedMembers,
                // Also remove from admins if they were an admin
                admins: Array.isArray(group.admins) ?
                    group.admins.filter(admin => admin !== memberId) :
                    group.admins
            },
        });

        // Revalidate the group page
        revalidatePath(`/learn/group/${groupId}`);

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error removing member from group:", error);
        return {
            success: false,
            error: "Er is een fout opgetreden bij het verwijderen van het lid",
        };
    }
}

