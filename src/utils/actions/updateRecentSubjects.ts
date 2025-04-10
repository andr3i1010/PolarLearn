"use server"

import { prisma } from "@/utils/prisma";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/utils/auth/auth";

export async function addToRecentSubjects(subject: string) {
    const user = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);
    if (!user) return;

    // Update user's recent_subjects array
    const account = await prisma.user.findUnique({
        where: { id: user.id }
    });

    const listData = account?.list_data as any || {};
    const recentSubjects = Array.isArray(listData.recent_subjects) ? listData.recent_subjects : [];

    // If the subject is already at position 0, no need to update
    if (recentSubjects[0] === subject) {
        return;
    }

    // Remove the subject if it already exists to avoid duplicates
    const updatedRecentSubjects = recentSubjects.filter((s: string) => s !== subject);

    // Check if anything changed - only update if needed
    const needsUpdate = recentSubjects.length !== updatedRecentSubjects.length ||
        recentSubjects[0] !== subject;

    if (!needsUpdate) {
        return;
    }

    // Add the new subject at the beginning (most recent)
    updatedRecentSubjects.unshift(subject);

    // Keep only a limited number of recent subjects (e.g., 5)
    const limitedRecentSubjects = updatedRecentSubjects.slice(0, 5);

    // Update the user record
    await prisma.user.update({
        where: { id: user.id },
        data: {
            list_data: {
                ...listData,
                recent_subjects: limitedRecentSubjects
            }
        }
    });
}
