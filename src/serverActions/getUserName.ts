'use server'

import { prisma } from '@/utils/prisma';

// Return a more complete user info object instead of just the name
export async function getUserNameById(id: string): Promise<{ name: string | null, jdenticonValue: string | null }> {
    try {
        if (!id) return { name: null, jdenticonValue: null };

        const user = await prisma.user.findUnique({
            where: { id },
            select: { 
                name: true,
                // Include any other fields you might want to use
                image: true
            }
        });

        if (!user || !user.name) {
            return { name: null, jdenticonValue: id };
        }

        // Return the name for display and the stable value for Jdenticon
        return { 
            name: user.name, 
            jdenticonValue: user.name // Use the username for the Jdenticon value
        };
    } catch (error) {
        console.error('Error fetching user name:', error);
        return { name: null, jdenticonValue: id };
    }
}
