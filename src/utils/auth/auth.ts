"use server";

import { prisma } from "../prisma";
import { hashPassword } from "./user";
import { createSession, decodeCookie } from "./session";
import { cookies } from "next/headers";
import { createActionNonce } from "./nonce";

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

    if (user.loginAllowed === false) {
      return {
        banned: true,
        message: user.banReason || "Geen reden opgegeven"
      };
    }

    const hashedPassword = await hashPassword(password, user.salt);

    if (user.password === hashedPassword) {
      await createSession(user.id);
      // Create a nonce for the user after successful login
      try {
        await createActionNonce(user.id);
      } catch (error) {
        console.error("Error creating nonce during login:", error);
        // Don't fail the login if nonce creation fails
      }
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
