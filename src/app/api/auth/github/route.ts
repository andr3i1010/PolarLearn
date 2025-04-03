import { GithubOAuth } from "@/utils/auth/oauth";
import { prisma } from "@/utils/prisma";
import { createSession } from "@/utils/auth/session";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    const githubOAuth = new GithubOAuth();
    const url = githubOAuth.getAuthUrl();
    return Response.redirect(url, 302);
  }

  const githubOAuth = new GithubOAuth();
  const tokenResponse = await githubOAuth.getTokens(code);
  const accessToken = tokenResponse.access_token;
  if (!accessToken) {
    return new Response("No access_token", { status: 400 });
  }

  const githubProfile = await githubOAuth.getUser(accessToken);
  let email = githubProfile.email;
  if (!email) {
    const emails = await githubOAuth.getUserEmails(accessToken);
    const primaryEmailObj = emails.find((e: any) => e.primary && e.verified);
    if (primaryEmailObj) {
      email = primaryEmailObj.email;
      githubProfile.email = email;
    } else {
      return NextResponse.redirect(
        new URL("/auth/sign-in?error=oautherror&provider=github", request.url),
        302
      );
    }
  }

  // Only allow OAuth sign‑in if a user with the email exists
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await githubOAuth.mergeGithubOAuth(accessToken, {
      id: String(githubProfile.id),
      email,
    });
  }

  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=usernotfound&provider=github", request.url),
      302
    );
  }

  if (!user.githubOAuthID) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { githubOAuthID: String(githubProfile.id) },
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
