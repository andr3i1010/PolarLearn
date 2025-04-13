"use server";
import { cookies } from "next/headers";
import { prisma } from "../prisma";
import { CompactEncrypt, compactDecrypt } from "jose";
import crypto from 'crypto';

export async function createSession(userid: string) {
  // console.debug("createSession: Attempting session creation for user", userid);
  const sessionID = crypto.randomUUID();
  // Compute expiration on each call (1 day from now)
  const sessionExp = new Date(Date.now() + 1000 * 60 * 60 * 24);
  return new Promise(async (resolve, reject) => {
    await prisma.session
      .create({
        data: {
          sessionID: sessionID,
          userId: userid,
          expires: sessionExp,
        },
      })
      .then(async () => {
        // console.debug("createSession: Session created with ID", sessionID);
        await createCookie(sessionID, sessionExp);
        // console.debug("createSession: Cookie created for session", sessionID);
        resolve(sessionID);
      })
      .catch((error: any) => {
        console.error("createSession: Error creating session", error);
        reject(error);
      });
  });
}

export async function createCookie(sessionId: string, sessionExp: Date) {
  // console.debug("createCookie: Creating cookie for session", sessionId);
  const payload = JSON.stringify({
    sessionId,
    exp: Math.floor(sessionExp.getTime() / 1000)
  });
  // Derive a 256-bit key from process.env.SECRET
  const secret = crypto.createHash('sha256').update(process.env.SECRET as string).digest();
  const jwe = await new CompactEncrypt(new TextEncoder().encode(payload))
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(secret);
  (await cookies()).set("polarlearn.session-id", jwe, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    expires: sessionExp,
  });
  // console.debug("createCookie: Cookie set for session", sessionId);
}

export async function decodeCookie(token: string): Promise<string | null> {
  // console.debug("decodeCookie: Decoding token");
  try {
    const secret = crypto.createHash('sha256').update(process.env.SECRET as string).digest();
    const { plaintext } = await compactDecrypt(token, secret);
    const decoded = JSON.parse(new TextDecoder().decode(plaintext)) as { sessionId: string; exp: number };
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      // console.debug("decodeCookie: Token expired");
      return null;
    }
    // console.debug("decodeCookie: Token valid for session", decoded.sessionId);
    return decoded.sessionId;
  } catch (error) {
    console.error("decodeCookie: Error decoding token", error);
    return null;
  }
}

export async function isLoggedIn() {
  // console.debug("isLoggedIn: Checking user session");
  const cookie = await (await cookies()).get('polarlearn.session-id');
  if (!cookie) {
    // console.debug("isLoggedIn: No cookie found");
    return false;
  }
  const sessionId = await decodeCookie(cookie.value);
  if (!sessionId) {
    // console.debug("isLoggedIn: Invalid session from token");
    return false;
  }
  const session = await prisma.session.findUnique({
    where: {
      sessionID: sessionId,
    },
  });
  if (!session) {
    // console.debug("isLoggedIn: Session not found in DB, clearing cookie");
    await (await cookies()).set('polarlearn.session-id', '', {
      expires: new Date(0),
    });
    return false;
  }
  if (session.expires < new Date()) {
    // console.debug("isLoggedIn: Session expired, logging out");
    await logOut();
    return false;
  }

  // Extend session expiration (sliding expiration)
  const newExp = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day extension
  await prisma.session.update({
    where: { sessionID: sessionId },
    data: { expires: newExp },
  });
  // Update the cookie with the new expiration
  await createCookie(sessionId, newExp);
  // console.debug("isLoggedIn: Session is active", sessionId);
  return true;
}

export async function logOut() {
  // console.debug("logOut: Logging out user");
  const cookie = await (await cookies()).get('polarlearn.session-id');
  if (!cookie) {
    // console.debug("logOut: No cookie found");
    return;
  }
  const sessionId = await decodeCookie(cookie.value);
  if (!sessionId) {
    // console.debug("logOut: Invalid session token");
    return;
  }
  await (await cookies()).delete('polarlearn.session-id');

  // console.debug("logOut: Cookie deleted for session", sessionId);

  prisma.session.delete({
    where: {
      sessionID: sessionId,
    },
  }).then(() => {
    // console.debug("logOut: Session record deleted for", sessionId);
  }).catch((error: any) => {
    console.error("logOut: Error deleting session record", error);
  });
}