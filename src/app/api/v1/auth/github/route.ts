import { getGithubAuthUrl, getGithubTokens, getGithubUser, getGithubUserEmails, mergeGithubAccount } from "@/utils/auth/oauth";
import { prisma } from "@/utils/prisma";
import { createSession } from "@/utils/auth/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getValidRedirectPath } from "@/utils/auth/redirect";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const requestCookies = await cookies();

  const baseUrl = process.env.NEXT_PUBLIC_URL && process.env.NEXT_PUBLIC_URL.trim() !== ""
    ? process.env.NEXT_PUBLIC_URL
    : "http://localhost:3000";

  if (!code) {
    const state = randomBytes(32).toString("hex");
    const url = await getGithubAuthUrl(state);
    const response = NextResponse.redirect(url, 302);
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set("polarlearn.oauth_state_github", state, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/api/v1/auth",
      maxAge: 60 * 15,
    });
    return response;
  }

  // Verify the state parameter matches the stored cookie
  const stateCookie = requestCookies.get("polarlearn.oauth_state_github")?.value;
  if (!stateParam || !stateCookie || stateParam !== stateCookie) {
    const errResponse = NextResponse.redirect(
      new URL("/auth/sign-in?error=invalid_state&provider=github", baseUrl),
      302
    );
    errResponse.cookies.delete("polarlearn.oauth_state_github");
    return errResponse;
  }

  const tokenResponse = await getGithubTokens(code);
  const accessToken = tokenResponse.access_token;
  if (!accessToken) {
    const badResponse = new NextResponse("No access_token", { status: 400 });
    badResponse.cookies.delete('polarlearn.oauth_state_github');
    return badResponse;
  }

  const githubProfile = await getGithubUser(accessToken);
  let email = githubProfile.email;
  if (!email) {
    const emails = await getGithubUserEmails(accessToken);
    const primaryEmailObj = emails.find((e: any) => e.primary && e.verified);
    if (primaryEmailObj) {
      email = primaryEmailObj.email;
      githubProfile.email = email;
    } else {
      const errResponse = NextResponse.redirect(
        new URL("/auth/sign-in?error=oautherror&provider=github", baseUrl),
        302
      );
      errResponse.cookies.delete('polarlearn.oauth_state_github');
      return errResponse;
    }
  }

  // Only allow OAuth sign‑in if a user with the email exists
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await mergeGithubAccount(accessToken, {
      id: String(githubProfile.id),
      email,
    });
  }

  if (!user) {
    const errResponse = NextResponse.redirect(
      new URL("/auth/sign-in?error=usernotfound&provider=github", baseUrl),
      302
    );
    errResponse.cookies.delete('polarlearn.oauth_state_github');
    return errResponse;
  }

  if (!user.githubOAuthID) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { githubOAuthID: String(githubProfile.id) },
    });
  }

  await createSession(user.id);

  // Check for redirect cookie and redirect accordingly
  const gotoCookie = (await cookies()).get('polarlearn.goto');
  const redirectPath = getValidRedirectPath(gotoCookie?.value);

  // Create response with redirect and clear the goto cookie and oauth state cookie
  const response = NextResponse.redirect(new URL(redirectPath, baseUrl), 302);
  response.cookies.delete('polarlearn.goto');
  response.cookies.delete('polarlearn.oauth_state_github');

  return response;
}
