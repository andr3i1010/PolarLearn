import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '../prisma';
import { getUserFromSession } from './auth';
import crypto from 'crypto';

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
    if (!record || record.userId !== user.id) {
        await prisma.user.update({
            where: { id: user.id },
            data: { loginAllowed: false, banReason: 'Invalid action nonce detected' },
        });
        throw new Error('Invalid action nonce');
    }
    // Note: Don't delete the nonce here - it should persist for the session
    // Only delete on logout or session expiry
}

/**
 * Generates a new action nonce for the user, stores it in the database, and sets a cookie.
 */
export async function createActionNonce(userId: string) {
    // generate base64-encoded UUID
    const actionNonce = Buffer.from(crypto.randomUUID()).toString('base64');
    // Remove old nonce for this user
    await prisma.nonce.deleteMany({ where: { userId } });
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
        // Create a new nonce for the user (this will replace the old one)
        const newNonce = await createActionNonce(userId);
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
