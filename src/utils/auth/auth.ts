"use server";

import { prisma } from "../prisma";
import { hashPassword } from "./user";
import { createSession, decodeCookie } from "./session";
import { cookies } from "next/headers";

export async function signInCredentials(
  email: string,
  password: string
): Promise<string | boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return "invcreds";
    }

    if (!user.loginAllowed) return 'banned';

    const hashedPassword = await hashPassword(password, user.salt);

    if (user.password === hashedPassword) {
      await createSession(user.id);
      return true;
    } else return ("invcreds");
  } catch (error) {
    console.log(error);
    return error as string;
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
