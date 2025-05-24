"use server";

import { cookies } from "next/headers";
import { prisma } from "@/utils/prisma";
import { endImpersonation } from "@/utils/auth/impersonate";

/**
 * Server action to check if the current user is impersonating another user
 * This is used by the client component to display the impersonation banner
 */
export async function checkImpersonationStatus() {
    try {
        const adminCookie = await (await cookies()).get("polarlearn.admin-id");

        // If there's no admin cookie, not in impersonation mode
        if (!adminCookie?.value) {
            return null;
        }

        let adminData: { adminId: string; impersonatingUserId: string } | null = null;

        try {
            adminData = JSON.parse(adminCookie.value);
        } catch (e) {
            console.error("Invalid admin ID cookie format:", e);
            await endImpersonation();
            return null;
        }

        if (!adminData?.adminId || !adminData?.impersonatingUserId) {
            await endImpersonation();
            return null;
        }

        // Get the admin user
        const admin = await prisma.user.findUnique({
            where: {
                id: adminData.adminId,
            },
            select: {
                id: true,
                name: true,
                role: true,
            }
        });

        // If admin not found or not actually an admin, end impersonation
        if (!admin || admin.role !== "admin") {
            await endImpersonation();
            return null;
        }

        // Get the impersonated user
        const impersonatedUser = await prisma.user.findUnique({
            where: {
                id: adminData.impersonatingUserId,
            },
            select: {
                id: true,
                name: true,
                email: true,
            }
        });

        if (!impersonatedUser) {
            await endImpersonation();
            return null;
        }

        return {
            admin,
            impersonatedUser,
            isImpersonating: true
        };
    } catch (error) {
        console.error("Error checking impersonation:", error);
        return null;
    }
}
