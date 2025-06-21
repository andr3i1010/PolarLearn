import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '../prisma';
import { getUserFromSession } from './auth';
import crypto from 'crypto';

/**
 * Clean up old nonces (24+ hours old) globally
 * This helps prevent the nonce table from growing indefinitely
 */
async function cleanupOldNonces() {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
        const result = await prisma.nonce.deleteMany({
            where: {
                createdAt: { lt: twentyFourHoursAgo },
            },
        });

        if (result.count > 0) {
            console.log(`Cleaned up ${result.count} old nonces`);
        }
    } catch (error) {
        console.error('Error cleaning up old nonces:', error);
        // Don't throw error as this is a background cleanup operation
    }
}

/**
 * Clean up old nonces globally (exported for potential scheduled jobs)
 * Removes nonces older than 24 hours
 */
export async function cleanupAllOldNonces() {
    return await cleanupOldNonces();
}

export async function validateActionNonce() {
    const user = await getUserFromSession();
    if (!user) {
        redirect('/auth/sign-in');
    }
    const cookieStore = await cookies();
    const actionNonce = cookieStore.get('polarlearn.nonce.NIET_BEWERKEN!!')?.value;
    if (!actionNonce) {
        redirect('/auth/sign-in');
    }
    const record = await prisma.nonce.findUnique({ where: { nonce: actionNonce } });
    if (!record) {
        // Nonce not found - likely a replay attack with an old/used nonce
        await prisma.user.update({
            where: { id: user.id },
            data: { loginAllowed: false, banReason: 'Geautomatiseerde verbanning bij replay-aanval of noncewijziging' },
        });
        throw new Error('Nonce replay attack detected');
    }
    if (record.userId !== user.id) {
        // Nonce belongs to different user - potential session hijacking
        await prisma.user.update({
            where: { id: user.id },
            data: { loginAllowed: false, banReason: 'Geautomatiseerde verbanning bij replay-aanval of noncewijziging' },
        });
        throw new Error('Cross-user nonce attack detected');
    }
    // Nonce is valid, so we can delete it now to prevent reuse.
    await prisma.nonce.delete({ where: { nonce: actionNonce } });

    // Clean up old nonces after successful validation
    await cleanupOldNonces();
}

/**
 * Generates a new action nonce for the user, stores it in the database, and sets a cookie.
 */
export async function createActionNonce(userId: string) {
    // Clean up old nonces before creating new one
    await cleanupOldNonces();

    // generate base64-encoded UUID
    const actionNonce = Buffer.from(crypto.randomUUID()).toString('base64');
    // Store new nonce
    await prisma.nonce.create({ data: { userId, nonce: actionNonce } });
    const cookieStore = await cookies();
    // Set nonce cookie with correct key
    cookieStore.set('polarlearn.nonce.NIET_BEWERKEN!!', actionNonce, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(Date.now() + 1000 * 60 * 60 * 48),
    });
    return actionNonce;
}

/**
 * Removes the nonce for a user (called on logout)
 */
export async function removeUserNonce(userId: string) {
    try {
        // Remove from database
        await prisma.nonce.deleteMany({ where: { userId } });

        // Remove from cookie
        const cookieStore = await cookies();
        cookieStore.delete('polarlearn.nonce.NIET_BEWERKEN!!');

        // Clean up old nonces from all users on logout
        await cleanupOldNonces();

    } catch (error) {
        console.error('Error removing nonce:', error);
        throw error;
    }
}

/**
 * Gets the current user's nonce from the cookie
 */
export async function getCurrentNonce(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const nonceCookie = cookieStore.get('polarlearn.nonce.NIET_BEWERKEN!!');
        return nonceCookie?.value || null;
    } catch (error) {
        console.error('Error getting current nonce:', error);
        return null;
    }
}

/**
 * Rotates (refreshes) the nonce for a user after a successful server action
 * This prevents replay attacks by ensuring each nonce can only be used once per session
 */
export async function rotateUserNonce(userId: string): Promise<string | null> {
    try {
        // Clean up old nonces before creating new one
        await cleanupOldNonces();

        // Create a new nonce for the user
        const newNonce = Buffer.from(crypto.randomUUID()).toString('base64');
        await prisma.nonce.create({ data: { userId, nonce: newNonce } });

        const cookieStore = await cookies();
        cookieStore.set('polarlearn.nonce.NIET_BEWERKEN!!', newNonce, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(Date.now() + 1000 * 60 * 60 * 48),
        });

        return newNonce;
    } catch (error) {
        console.error('Error rotating nonce:', error);
        return null;
    }
}

/**
 * Rotates the nonce after a successful server action
 * This should be called at the END of successful server actions
 * Note: Nonce validation is handled by middleware, this only rotates
 */
export async function rotateCurrentUserNonce(): Promise<boolean> {
    try {
        const user = await getUserFromSession();
        if (!user) {
            return false;
        }

        // Rotate the nonce for the next request
        await rotateUserNonce(user.id);
        return true;

    } catch (error) {
        console.error('Error in rotateCurrentUserNonce:', error);
        return false;
    }
}

/**
 * Check if a user is banned and get ban reason
 */
export async function checkUserBanStatus(userId: string): Promise<{ banned: boolean; reason?: string }> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { loginAllowed: true, banReason: true }
        });

        if (!user) {
            return { banned: true, reason: 'User not found' };
        }

        return {
            banned: !user.loginAllowed,
            reason: user.banReason || undefined
        };
    } catch (error) {
        console.error('Error checking user ban status:', error);
        return { banned: true, reason: 'Error checking ban status' };
    }
}
