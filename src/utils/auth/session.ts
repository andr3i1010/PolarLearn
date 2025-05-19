"use server";
import { cookies } from "next/headers";
import { prisma } from "../prisma";
import { CompactEncrypt, compactDecrypt } from "jose";
import crypto from 'crypto';

// Function to set up TTL index for session expiration
async function setupSessionTTLIndex() {
  try {
    // First check if the index already exists to avoid unnecessary operations
    const indexInfo = await prisma.$runCommandRaw({
      listIndexes: 'Session',
    });

    // @ts-ignore - indexInfo is a MongoDB response with cursor.firstBatch array
    const indexes = indexInfo.cursor.firstBatch;
    const ttlIndexExists = indexes.some((idx: any) =>
      idx.name === 'expires_ttl_index' && idx.expireAfterSeconds === 0
    );

    if (ttlIndexExists) {
      return;
    }

    // If the index doesn't exist or has different settings, create/recreate it
    await prisma.$runCommandRaw({
      createIndexes: 'Session', // MongoDB collection name (case sensitive)
      indexes: [
        {
          key: { expires: 1 },
          name: 'expires_ttl_index',
          expireAfterSeconds: 0 // Delete immediately after the expires date
        }
      ]
    });
    // console.log("TTL index for session expiration configured successfully");
  } catch (error) {
    console.error("Failed to set up TTL index for sessions:", error);
  }
}

// New function to ensure TTL index exists after Prisma schema push
export async function ensureSessionTTLIndex() {
  // console.log("Ensuring TTL index exists after Prisma schema operations...");
  return setupSessionTTLIndex();
}

// Ensure TTL index is set up on module load
ensureSessionTTLIndex();

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

export async function createCookie(sessionId: string, sessionExp: Date, cookieName: string = "polarlearn.session-id") {
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

  // Add these cookie options to ensure consistency
  const cookieOptions = {
    expires: sessionExp,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const, // Type-safe declaration
  };

  (await cookies()).set(cookieName, jwe, cookieOptions);
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

  try {
    const sessionId = await decodeCookie(cookie.value);
    if (!sessionId) {
      console.error("isLoggedIn: Invalid session from token or token expired");
      return false;
    }

    const session = await prisma.session.findUnique({
      where: {
        sessionID: sessionId,
      },
    });

    if (!session) {
      console.error("isLoggedIn: Session not found in DB for sessionId", sessionId);
      await (await cookies()).set('polarlearn.session-id', '', {
        expires: new Date(0),
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax' as const, // Fix type issue
      });
      return false;
    }

    if (session.expires < new Date()) {
      console.error("isLoggedIn: Session expired in DB for sessionId", sessionId);
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
  } catch (error) {
    console.error("isLoggedIn: Error verifying session", error);
    // Don't automatically log out on errors - this could be causing the unexpected logouts
    return false;
  }
}

export async function logOut() {
  try {
    // console.debug("logOut: Logging out user");
    const cookie = await (await cookies()).get('polarlearn.session-id');
    if (!cookie) {
      // console.debug("logOut: No cookie found");
      return;
    }

    const sessionId = await decodeCookie(cookie.value);
    if (!sessionId) {
      // console.debug("logOut: Invalid session token");
      await (await cookies()).delete('polarlearn.session-id');
      return;
    }

    // Set proper cookie deletion options
    await (await cookies()).set('polarlearn.session-id', '', {
      expires: new Date(0),
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax' as const, // Fix type issue
    });

    // console.debug("logOut: Cookie deleted for session", sessionId);

    try {
      await prisma.session.delete({
        where: {
          sessionID: sessionId,
        },
      });
      // console.debug("logOut: Session record deleted for", sessionId);
    } catch (error) {
      console.error("logOut: Error deleting session record", error);
    }
  } catch (error) {
    console.error("logOut: Unexpected error during logout", error);
  }
}