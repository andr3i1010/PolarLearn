import { getGithubAuthUrl, getGithubTokens, getGithubUser, getGithubUserEmails, mergeGithubAccount } from "@/utils/auth/oauth";
import { prisma } from "@/utils/prisma";
import { createSession } from "@/utils/auth/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getValidRedirectPath } from "@/utils/auth/redirect";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  const baseUrl = process.env.NEXT_PUBLIC_URL && process.env.NEXT_PUBLIC_URL.trim() !== ""
    ? process.env.NEXT_PUBLIC_URL
    : "http://localhost:3000";

  if (!code) {
    const url = await getGithubAuthUrl();
    return Response.redirect(url, 302);
  }

  const tokenResponse = await getGithubTokens(code);
  const accessToken = tokenResponse.access_token;
  if (!accessToken) {
    return new Response("No access_token", { status: 400 });
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
      return NextResponse.redirect(
        new URL("/auth/sign-in?error=oautherror&provider=github", baseUrl),
        302
      );
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
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=usernotfound&provider=github", baseUrl),
      302
    );
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

  // Create response with redirect and clear the goto cookie
  const response = NextResponse.redirect(new URL(redirectPath, baseUrl), 302);
  response.cookies.delete('polarlearn.goto');

  return response;
}
