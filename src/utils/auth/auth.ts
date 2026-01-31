"use server";

import { prisma } from "../prisma";
import { hashPassword } from "./user";
import { createSession, decodeCookie } from "./session";
import { cookies } from "next/headers";
import { sendSignUpEmail } from "./user";
import crypto from "crypto";
// Dummy salt used to ensure Argon2 hashing runs even when a user is not found,
// preventing timing-based user enumeration (GHSA-wcr9-mvr9-4qh5).
const DUMMY_SALT = crypto.randomBytes(16).toString("base64");

export async function signInCredentials(
  email: string,
  password: string
): Promise<string | boolean | { banned: boolean; message: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Use a dummy salt for non-existent users so the Argon2 hashing step is always executed
    const salt = user?.salt ?? DUMMY_SALT;

    // Always perform the expensive hash to mitigate timing-based user enumeration
    const hashedPassword = await hashPassword(password, salt);

    // If the user does not exist, return a generic invalid credentials response
    // after performing the expensive operation above to avoid timing leakage.
    if (!user) {
      return "invcreds";
    }

    if (!user.emailVerified) {
      // Generate new activation token and send verification email
      try {
        const newActivationToken = crypto.randomBytes(32).toString("hex");

        // Extend scheduled deletion by 24 hours (if supported)
        const newScheduledDeletion = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Update user with new token and extended deletion time
        const updateData: any = {};
        try {
          updateData.activationToken = newActivationToken;
          updateData.scheduledDeletion = newScheduledDeletion;
        } catch {
          console.warn("Prisma schema may not include activationToken/scheduledDeletion fields");
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: updateData
          });
        }

        // Send verification email
        await sendSignUpEmail(user.email!, user.name || 'Gebruiker', newActivationToken);
      } catch (emailError) {
        console.error("Failed to send verification email during sign-in:", emailError);
        // Continue with the error response even if email sending fails
      }

      return "email_not_verified";
    }

    if (user.loginAllowed === false) {
      // Create a session even for banned users so they can access the banned page
      try {
        await createSession(user.id);
      } catch (err) {
        console.error("Failed to create session for banned user:", err);
      }

      return {
        banned: true,
        message: user.banReason || "Geen reden opgegeven"
      };
    }

    // Compare hashes using a timing-safe comparison when possible
    const storedHashBuffer = Buffer.from(user.password);
    const computedHashBuffer = Buffer.from(hashedPassword);

    let passwordMatches = false;
    if (storedHashBuffer.length === computedHashBuffer.length) {
      try {
        passwordMatches = crypto.timingSafeEqual(storedHashBuffer, computedHashBuffer);
      } catch {
        // If timingSafeEqual fails for any reason, fallback to strict equality
        passwordMatches = user.password === hashedPassword;
      }
    } else {
      // Different lengths — fallback to strict equality
      passwordMatches = user.password === hashedPassword;
    }

    if (passwordMatches) {
      await createSession(user.id);
      return true;
    } else {
      return "invcreds";
    }
  } catch (error) {
    console.error("Error in signInCredentials:", error);
    // Ensure we always return a string, never null/undefined
    if (error && typeof error === 'string') {
      return error;
    } else if (error && error instanceof Error) {
      return error.message || "interne serverfout";
    } else {
      return "interne serverfout";
    }
  }
}

export async function getUserFromSession(sessionId?: string) {
  try {
    if (!sessionId) {
      const sessionCookie = (await cookies()).get("polarlearn.session-id");
      if (!sessionCookie || !sessionCookie.value) {
        return null;
      }
      sessionId = sessionCookie.value;
    }

    const decodedSessionId = await decodeCookie(sessionId);
    if (!decodedSessionId) {
      return null;
    }

    const session = await prisma.session.findFirst({
      where: {
        sessionID: decodedSessionId,
      },
    });

    if (!session) {
      return null;
    }

    if (!session.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting user from session:", error);
    return null;
  }
}
