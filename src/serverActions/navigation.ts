'use server'

import { redirect } from 'next/navigation';
import { getUserIdByName } from './getUserName';

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function navigateToUserProfile(identifier: string) {
    try {
        let targetId = identifier;

        // If identifier is not a UUID, get the UUID
        if (!UUID_REGEX.test(identifier)) {
            const userInfo = await getUserIdByName(identifier);
            if (userInfo.id) {
                targetId = userInfo.id;
            }
        }

        redirect(`/home/viewuser/${targetId}`);
    } catch (error) {
        console.error('Error navigating to user profile:', error);
        // Fallback to original identifier if there's an error
        redirect(`/home/viewuser/${identifier}`);
    }
}
