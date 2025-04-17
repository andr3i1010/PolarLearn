import { getGoogleAuthUrl, getGoogleTokens, scanGoogleEmails, mergeGoogleAccount } from "@/utils/auth/oauth";
import { prisma } from "@/utils/prisma";
import { createSession } from "@/utils/auth/session";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    const url = await getGoogleAuthUrl();
    return Response.redirect(url, 302);
  }

  const tokens = await getGoogleTokens(code);
  const idToken = tokens.id_token;
  if (!idToken) {
    return new Response("No id_token", { status: 400 });
  }

  const payloadBase64Url = idToken.split(".")[1];
  const payloadBase64 = payloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");
  const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf8");
  const payload = JSON.parse(payloadJson);
  const googleId = payload.sub;
  const email = payload.email;

  if (!email) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=oautherror&provider=google", request.url),
      302
    );
  }

  // Only allow OAuth sign‑in if a user with the email already exists
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await scanGoogleEmails({
      access_token: tokens.access_token,
      providerAccountId: googleId,
    });
  }

  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=usernotfound&provider=google", request.url),
      302
    );
  }

  // If user's googleOAuthID is not set, update it
  if (!user.googleOAuthID) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleOAuthID: googleId },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL && process.env.NEXT_PUBLIC_URL.trim() !== ""
    ? process.env.NEXT_PUBLIC_URL
    : "http://localhost:3000";

  await createSession(user.id);
  return Response.redirect(
    new URL("/home/start", baseUrl),
    302
  );
}
