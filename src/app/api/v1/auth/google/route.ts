import { getGoogleAuthUrl, getGoogleTokens, scanGoogleEmails } from "@/utils/auth/oauth";
import { prisma } from "@/utils/prisma";
import { createSession } from "@/utils/auth/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getValidRedirectPath } from "@/utils/auth/redirect";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_URL && process.env.NEXT_PUBLIC_URL.trim() !== ""
    ? process.env.NEXT_PUBLIC_URL
    : "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const requestCookies = await cookies();

  if (!code) {
    const state = randomBytes(32).toString("hex");
    const url = await getGoogleAuthUrl(state);
    const response = NextResponse.redirect(url, 302);
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set("polarlearn.oauth_state_google", state, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/api/v1/auth",
      maxAge: 60 * 15,
    });
    return response;
  }

  // Verify the state parameter matches a previously set cookie
  const stateCookie = requestCookies.get("polarlearn.oauth_state_google")?.value;
  if (!stateParam || !stateCookie || stateParam !== stateCookie) {
    const errResponse = NextResponse.redirect(
      new URL("/auth/sign-in?error=invalid_state&provider=google", baseUrl),
      302
    );
    // Clean up any leftover state cookie
    errResponse.cookies.delete("polarlearn.oauth_state_google");
    return errResponse;
  }

  const tokens = await getGoogleTokens(code);
  const idToken = tokens.id_token;
  if (!idToken) {
    const badResponse = new NextResponse("geen id_token", { status: 400 });
    badResponse.cookies.delete('polarlearn.oauth_state_google');
    return badResponse;
  }

  const payloadBase64Url = idToken.split(".")[1];
  const payloadBase64 = payloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");
  const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf8");
  const payload = JSON.parse(payloadJson);
  const googleId = payload.sub;
  const email = payload.email;

  if (!email) {
    const errResponse = NextResponse.redirect(
      new URL("/auth/sign-in?error=oautherror&provider=google", baseUrl),
      302
    );
    errResponse.cookies.delete('polarlearn.oauth_state_google');
    return errResponse;
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
    const errResponse = NextResponse.redirect(
      new URL("/auth/sign-in?error=usernotfound&provider=google", baseUrl),
      302
    );
    errResponse.cookies.delete('polarlearn.oauth_state_google');
    return errResponse;
  }

  // If user's googleOAuthID is not set, update it
  if (!user.googleOAuthID) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleOAuthID: googleId },
    });
  }

  await createSession(user.id);

  // Check for redirect cookie and redirect accordingly
  const gotoCookie = (await cookies()).get('polarlearn.goto');
  const redirectPath = getValidRedirectPath(gotoCookie?.value);

  // Create response with redirect and clear the goto cookie and oauth state cookie
  const response = NextResponse.redirect(new URL(redirectPath, baseUrl), 302);
  response.cookies.delete('polarlearn.goto');
  response.cookies.delete('polarlearn.oauth_state_google');

  return response;
}
