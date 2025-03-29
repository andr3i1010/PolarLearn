"use server";
import { cookies } from "next/headers";
import { prisma } from "../prisma";
import { CompactEncrypt, compactDecrypt } from "jose";
import crypto from 'crypto';
import { redirect } from "next/navigation";

const sessionExp = new Date(Date.now() + 1000 * 60 * 60 * 24 * 1);

export async function createSession(userid: string) {
  const sessionID = crypto.randomUUID();
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
        await createCookie(sessionID);
        resolve(sessionID);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export async function createCookie(sessionId: string) {
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
}

export async function decodeCookie(token: string): Promise<string | null> {
  try {
    const secret = crypto.createHash('sha256').update(process.env.SECRET as string).digest();
    const { plaintext } = await compactDecrypt(token, secret);
    const decoded = JSON.parse(new TextDecoder().decode(plaintext)) as { sessionId: string; exp: number };
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded.sessionId;
  } catch (error) {
    return null;
  }
}

export async function isLoggedIn() {
  const cookie = await (await cookies()).get('polarlearn.session-id');
  if (!cookie) {
    return false;
  }
  const sessionId = await decodeCookie(cookie.value);
  if (!sessionId) {
    return false;
  }
  const session = await prisma.session.findUnique({
    where: {
      sessionID: sessionId,
    },
  });
  if (!session) {
    await (await cookies()).set('polarlearn.session-id', '', {
      expires: new Date(0),
    });
    return false;
  }
  if (session.expires < new Date()) {
    await (await cookies()).set('polarlearn.session-id', '', {
      expires: new Date(0),
    });

    prisma.session.delete({
      where: {
        sessionID: sessionId,
      },
    });
    return false;
  }
  return true;
}

export async function logOut() {
  const cookie = await (await cookies()).get('polarlearn.session-id');
  if (!cookie) {
    return;
  }
  const sessionId = await decodeCookie(cookie.value);
  if (!sessionId) {
    return;
  }
  await (await cookies()).delete('polarlearn.session-id');

  prisma.session.delete({
    where: {
      sessionID: sessionId,
    },
  });
}