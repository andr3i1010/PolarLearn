"use server";
import { prisma } from './prisma';

/**
 * Gets user information by their ID or username
 * Used for backward compatibility during the username to UUID migration
 */
export async function getUserByIdOrName(creatorId: string) {
  // Try to find user by ID first
  let user = await prisma.user.findUnique({
    where: { id: creatorId },
    select: {
      id: true,
      name: true,
      image: true,
    }
  });

  // If not found by ID, try by name (for backward compatibility)
  if (!user) {
    user = await prisma.user.findUnique({
      where: { name: creatorId },
      select: {
        id: true,
        name: true,
        image: true,
      }
    });
  }

  return user;
}
