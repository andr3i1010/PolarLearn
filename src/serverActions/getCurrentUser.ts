"use server";

import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";

export async function getCurrentUser() {
    try {
        const sessionCookie = (await cookies()).get("polarlearn.session-id");

        if (!sessionCookie?.value) {
            return null;
        }

        const user = await getUserFromSession(sessionCookie.value);

        if (!user || !user.loginAllowed) {
            return null;
        }

        // Return only the necessary data for permission checking
        return {
            id: user.id,
            name: user.name,
            role: user.role || 'user'
        };
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}
