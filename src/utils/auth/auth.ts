"use server";

import { prisma } from "../prisma";
import { hashPassword } from "./user";
import { createSession, decodeCookie } from "./session";
import { cookies } from "next/headers";
import { sendSignUpEmail } from "./user";
import crypto from "crypto";

export async function signInCredentials(
  email: string,
  password: string
): Promise<string | boolean | { banned: boolean; message: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

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
        } catch (e) {
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
      return {
        banned: true,
        message: user.banReason || "Geen reden opgegeven"
      };
    }

    const hashedPassword = await hashPassword(password, user.salt);

    if (user.password === hashedPassword) {
      await createSession(user.id);
      return true;
    } else return ("invcreds");
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

    const user = await prisma.user.findFirst({
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
