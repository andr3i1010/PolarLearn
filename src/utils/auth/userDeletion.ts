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
            console.log("TTL index for user deletion already exists");
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
        console.log("TTL index for user account deletion configured successfully");
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
    console.log("Ensuring user deletion TTL index exists...");
    try {
        await setupUserDeletionTTLIndex();
        return true;
    } catch (error) {
        console.error("Failed to set up TTL index for user deletion:", error);
        return false;
    }
}

// Ensure TTL index is set up on module load
// This will run automatically when the application starts
ensureUserDeletionTTLIndex().then(success => {
    if (success) {
        console.log("User deletion TTL index is ready");
    }
});
