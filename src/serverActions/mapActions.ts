"use server";

import { prisma } from '@/utils/prisma';
import { cookies } from 'next/headers';
import { getUserFromSession } from '@/utils/auth/auth';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

// Get lists that are part of a map/folder
export async function getMapLists(mapId: string) {
  try {
    const map = await prisma.map.findUnique({
      where: { id: mapId }
    });

    if (!map) {
      return [];
    }

    // Get the list IDs from the map's lists field
    const listIds = map.lists || [];

    if (listIds.length === 0) {
      return [];
    }

    // Fetch the actual list data
    const lists = await prisma.practice.findMany({
      where: {
        list_id: { in: listIds }
      },
      orderBy: { createdAt: 'desc' }
    });

    return lists;
  } catch (error) {
    console.error("Error fetching map lists:", error);
    return [];
  }
}

// Get available lists that can be added to a map (only for creator)
export async function getAvailableListsForMap(mapId: string) {
  try {
    const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

    if (!session || !session.name) {
      return { success: false, error: "Not authenticated", lists: [] };
    }

    // Check if user is the creator of the map
    const map = await prisma.map.findUnique({
      where: { id: mapId }
    });

    if (!map || map.creator !== session.name) {
      return { success: false, error: "Not authorized", lists: [] };
    }

    // Get current map lists to exclude them
    const mapListIds = map.lists || [];

    // Get user's list data to find recent lists
    const userData = session.list_data as any;
    const recentListIds = Array.isArray(userData?.recent_lists) ? userData.recent_lists : [];
    const createdListIds = Array.isArray(userData?.created_lists) ? userData.created_lists : [];

    // If the user hasn't practiced any lists yet
    if (recentListIds.length === 0 && createdListIds.length === 0) {
      // Offer some published lists as a fallback
      const suggestedLists = await prisma.practice.findMany({
        where: {
          published: true,
          list_id: { notIn: mapListIds }
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

    // Fetch user's lists, excluding those already in the map
    const userLists = await prisma.practice.findMany({
      where: {
        AND: [
          // Not already in the map
          { list_id: { notIn: mapListIds } },
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
        // Neither list is recently practiced, sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return { success: true, lists: sortedLists };
  } catch (error) {
    console.error("Error fetching available lists for map:", error);
    return { success: false, error: "Failed to fetch lists", lists: [] };
  }
}

// Add a list to a map/folder
export async function addListToMap(mapId: string, listId: string) {
  try {
    const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

    if (!session || !session.name) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if map exists and user is creator
    const map = await prisma.map.findUnique({
      where: { id: mapId }
    });

    if (!map) {
      return { success: false, error: "Map not found" };
    }

    if (map.creator !== session.name) {
      return { success: false, error: "Not authorized - only the creator can modify this map" };
    }

    // Check if list exists
    const list = await prisma.practice.findFirst({
      where: { list_id: listId }
    });

    if (!list) {
      return { success: false, error: "List not found" };
    }

    // Get current lists
    const currentLists = map.lists || [];

    // Check if list is already in the map
    if (currentLists.includes(listId)) {
      return { success: false, error: "List is already in this map" };
    }

    // Add the list to the map
    await prisma.map.update({
      where: { id: mapId },
      data: {
        lists: [...currentLists, listId]
      }
    });

    revalidatePath(`/learn/map/${mapId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding list to map:", error);
    return { success: false, error: "Failed to add list to map" };
  }
}

// Add multiple lists to a map
export async function addListsToMap(mapId: string, listIds: string[]) {
  try {
    const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

    if (!session || !session.name) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if map exists and user is creator
    const map = await prisma.map.findUnique({
      where: { id: mapId }
    });

    if (!map) {
      return { success: false, error: "Map not found" };
    }

    if (map.creator !== session.name) {
      return { success: false, error: "Not authorized - only the creator can modify this map" };
    }

    // Get current lists
    const currentLists = map.lists || [];

    // Filter out lists that are already in the map
    const newLists = listIds.filter(listId => !currentLists.includes(listId));

    if (newLists.length === 0) {
      return { success: false, error: "All selected lists are already in this map" };
    }

    // Add the new lists to the map
    await prisma.map.update({
      where: { id: mapId },
      data: {
        lists: [...currentLists, ...newLists]
      }
    });

    revalidatePath(`/learn/map/${mapId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding lists to map:", error);
    return { success: false, error: "Failed to add lists to map" };
  }
}

// Remove a list from a map
export async function removeListFromMap(mapId: string, listId: string) {
  try {
    const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

    if (!session || !session.name) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if map exists and user is creator
    const map = await prisma.map.findUnique({
      where: { id: mapId }
    });

    if (!map) {
      return { success: false, error: "Map not found" };
    }

    if (map.creator !== session.name) {
      return { success: false, error: "Not authorized - only the creator can modify this map" };
    }

    // Get current lists
    const currentLists = map.lists || [];

    // Check if list is in the map
    if (!currentLists.includes(listId)) {
      return { success: false, error: "List is not in this map" };
    }

    // Remove the list from the map
    const updatedLists = currentLists.filter(id => id !== listId);

    await prisma.map.update({
      where: { id: mapId },
      data: {
        lists: updatedLists
      }
    });

    revalidatePath(`/learn/map/${mapId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing list from map:", error);
    return { success: false, error: "Failed to remove list from map" };
  }
}

// Create a new map/folder
export async function createMapAction({
  name,
  description,
  isPublic = false
}: {
  name: string;
  description?: string;
  isPublic?: boolean;
}) {
  try {
    const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

    if (!session || !session.name) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate input
    if (!name || name.trim().length === 0) {
      return { success: false, error: "Map name is required" };
    }

    if (name.length > 100) {
      return { success: false, error: "Map name is too long (max 100 characters)" };
    }

    // Generate unique ID
    const mapId = uuidv4();

    // Create the map
    await prisma.map.create({
      data: {
        id: mapId,
        name: name.trim(),
        creator: session.name,
        lists: [],
        public: isPublic,
        image: null
      }
    });

    revalidatePath('/learn/maps');
    return { success: true, mapId };
  } catch (error) {
    console.error("Error creating map:", error);
    return { success: false, error: "Failed to create map" };
  }
}

// Update map settings
export async function updateMapSettings({
  mapId,
  name,
  isPublic
}: {
  mapId: string;
  name: string;
  isPublic: boolean;
}) {
  try {
    const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

    if (!session || !session.name) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if map exists and user is creator
    const map = await prisma.map.findUnique({
      where: { id: mapId }
    });

    if (!map) {
      return { success: false, error: "Map not found" };
    }

    if (map.creator !== session.name) {
      return { success: false, error: "Not authorized - only the creator can modify this map" };
    }

    // Validate input
    if (!name || name.trim().length === 0) {
      return { success: false, error: "Map name is required" };
    }

    if (name.length > 100) {
      return { success: false, error: "Map name is too long (max 100 characters)" };
    }

    // Update the map
    await prisma.map.update({
      where: { id: mapId },
      data: {
        name: name.trim(),
        public: isPublic
      }
    });

    revalidatePath(`/learn/map/${mapId}`);
    revalidatePath('/learn/maps');
    return { success: true };
  } catch (error) {
    console.error("Error updating map settings:", error);
    return { success: false, error: "Failed to update map settings" };
  }
}

// Delete a map
export async function deleteMap(mapId: string) {
  try {
    const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

    if (!session || !session.name) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if map exists and user is creator
    const map = await prisma.map.findUnique({
      where: { id: mapId }
    });

    if (!map) {
      return { success: false, error: "Map not found" };
    }

    if (map.creator !== session.name) {
      return { success: false, error: "Not authorized - only the creator can delete this map" };
    }

    // Delete the map
    await prisma.map.delete({
      where: { id: mapId }
    });

    revalidatePath('/learn/maps');
    return { success: true };
  } catch (error) {
    console.error("Error deleting map:", error);
    return { success: false, error: "Failed to delete map" };
  }
}
