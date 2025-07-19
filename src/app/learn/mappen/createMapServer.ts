"use server";

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/utils/prisma';
import { cookies } from 'next/headers';
import { getUserFromSession } from '@/utils/auth/auth';
import { revalidatePath } from 'next/cache';

export async function createMapAction({
  name,
  isPublic
}: {
  name: string;
  isPublic: boolean;
}) {
  try {
    const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

    if (!session || !session.name) {
      return { success: false, error: "Je moet ingelogd zijn om een map aan te maken" };
    }

    const mapId = uuidv4();

    // Create the map
    const map = await prisma.map.create({
      data: {
        id: mapId,
        name,
        creator: session.name,
        lists: [],
        public: isPublic,
        image: null
      }
    });

    // Revalidate all relevant paths
    revalidatePath('/learn/mappen');
    revalidatePath(`/learn/map/${mapId}`);
    revalidatePath('/home/start');

    return { success: true, mapId };
  } catch (error) {
    console.error("Error creating map:", error);
    return { success: false, error: "Er is een fout opgetreden bij het aanmaken van de map" };
  }
}

// Original createMap function for backward compatibility
export async function createMap(
  name: string,
  isPublic: boolean = false
) {
  const result = await createMapAction({
    name,
    isPublic
  });

  if (result.success) {
    return result.mapId;
  } else {
    throw new Error(result.error || "Failed to create map");
  }
}
