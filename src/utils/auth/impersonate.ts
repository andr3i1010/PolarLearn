"use server";

import { prisma } from "../prisma";
import * as crypto from "crypto";
import { cookies } from "next/headers";
import { getUserFromSession } from "./auth";
import { createCookie, decodeCookie } from "./session";
import { revalidatePath } from "next/cache";

// Use the same cookie name as the normal session to make it work with the existing app
const IMPERSONATION_COOKIE_NAME = "polarlearn.session-id";
// Cookie to store the admin's original session while impersonating
const ADMIN_SESSION_COOKIE_NAME = "polarlearn.admin-session";

/**
 * Start impersonating a user
 * This will create a new temporary session for the admin to act as the user
 * 
 * @param userId ID of the user to impersonate
 */
export async function startImpersonation(userId: string) {
  try {
    // First check if the current user is an admin
    const admin = await getUserFromSession();

    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can impersonate users");
    }

    const adminId = admin.id;

    // Get user to impersonate
    const userToImpersonate = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToImpersonate) {
      throw new Error("User not found");
    }

    // Save the admin's current session cookie
    const adminSessionCookie = await (await cookies()).get(IMPERSONATION_COOKIE_NAME);
    if (!adminSessionCookie) {
      throw new Error("Admin session not found");
    }

    // Store admin's original session in a backup cookie
    await (await cookies()).set(ADMIN_SESSION_COOKIE_NAME, adminSessionCookie.value, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours expiry
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    });

    // Create impersonation session for the target user
    const sessionID = crypto.randomUUID();
    const sessionExp = new Date(Date.now() + 1000 * 60 * 60 * 2); // 2 hours (shorter for security)

    await prisma.session.create({
      data: {
        sessionID,
        userId: userId,
        expires: sessionExp,
      },
    });

    // Store admin ID in a separate cookie to indicate impersonation mode
    const adminCookieValue = JSON.stringify({ adminId, impersonatingUserId: userId });
    await (await cookies()).set("polarlearn.admin-id", adminCookieValue, {
      expires: sessionExp,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Set the main session cookie to the impersonated user's session
    await createCookie(sessionID, sessionExp, IMPERSONATION_COOKIE_NAME);

    revalidatePath('/');

    // Return success with user info
    return {
      success: true,
      user: userToImpersonate
    };
  } catch (error) {
    console.error("Error starting impersonation:", error);
    return { success: false, error };
  }
}

/**
 * End an active impersonation session
 * Restores the admin's original session
 */
export async function endImpersonation() {
  try {
    // Get the admin's original session cookie
    const adminSessionCookie = await (await cookies()).get(ADMIN_SESSION_COOKIE_NAME);

    if (adminSessionCookie?.value) {
      // Restore the admin's original session
      await (await cookies()).set(IMPERSONATION_COOKIE_NAME, adminSessionCookie.value, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax" as const,
      });
    }

    // Clear the admin backup session
    await (await cookies()).set(ADMIN_SESSION_COOKIE_NAME, "", {
      expires: new Date(0),
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax" as const,
    });

    // Clear admin ID cookie
    await (await cookies()).set("polarlearn.admin-id", "", {
      expires: new Date(0),
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error ending impersonation:", error);
    return { success: false, error };
  }
}

/**
 * Check if the current request is an impersonation session
 * Returns information about the impersonation if active, null otherwise
 */
export async function checkImpersonation() {
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