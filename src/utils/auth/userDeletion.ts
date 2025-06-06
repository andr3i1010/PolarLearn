"use server";

import { prisma } from "../prisma";

/**
 * Sets up a TTL index on the User collection to automatically delete users
 * after their scheduledDeletion date has passed
 */
export async function setupUserDeletionTTLIndex() {
    try {
        // First check if the index already exists to avoid unnecessary operations
        const indexInfo = await prisma.$runCommandRaw({
            listIndexes: 'User',
        });

        // @ts-ignore - indexInfo is a MongoDB response with cursor.firstBatch array
        const indexes = indexInfo.cursor.firstBatch;
        const ttlIndexExists = indexes.some((idx: any) =>
            idx.name === 'scheduledDeletion_ttl_index' && idx.expireAfterSeconds === 0
        );

        if (ttlIndexExists) {
            return;
        }

        // If the index doesn't exist or has different settings, create/recreate it
        await prisma.$runCommandRaw({
            createIndexes: 'User', // MongoDB collection name (case sensitive)
            indexes: [
                {
                    key: { scheduledDeletion: 1 },
                    name: 'scheduledDeletion_ttl_index',
                    expireAfterSeconds: 0 // Delete immediately after the scheduledDeletion date
                }
            ]
        });
    } catch (error) {
        console.error("Failed to set up TTL index for user deletion:", error);
    }
}

/**
 * Calculates the date 2 weeks from now for account deletion grace period
 */
export async function getAccountDeletionDate(): Promise<Date> {
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14); // 2 weeks = 14 days
    return twoWeeksFromNow;
}

// New function to ensure TTL index exists after Prisma schema push
export async function ensureUserDeletionTTLIndex() {
    try {
        await setupUserDeletionTTLIndex();
        return true;
    } catch (error) {
        console.error("Failed to set up TTL index for user deletion:", error);
        return false;
    }
}