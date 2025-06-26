import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { createSession } from "@/utils/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Activatie token is vereist" },
        { status: 400 }
      );
    }

    // Find user with the activation token
    let user = await prisma.user.findFirst({
      where: { activationToken: token }
    });

    // If no user found with the token, it could be:
    // 1. Invalid/expired token
    // 2. Already used token (activationToken was set to null after activation)
    if (!user) {
      // Check if any user was recently activated (within last 30 days) - this is a best effort check
      // In a production system, you might want to store used tokens separately
      return NextResponse.json(
        { error: "Ongeldige of verlopen activatie token. Als je account al geactiveerd is, probeer in te loggen." },
        { status: 400 }
      );
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Account is al geactiveerd" },
        { status: 400 }
      );
    }

    // Activate the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        activationToken: null,
        scheduledDeletion: null,
        loginAllowed: true,
        forumAllowed: true
      }
    });

    // Create session for the newly activated user
    await createSession(user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Account succesvol geactiveerd! Je bent nu ingelogd."
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Account activation error:", error);
    return NextResponse.json(
      { error: "🚨 Interne serverfout" },
      { status: 500 }
    );
  }
}

// Also support GET requests for direct link activation
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/auth/sign-in?error=missing_token', url.origin)
    );
  }

  try {
    // Find user with the activation token
    let user = await prisma.user.findFirst({
      where: { activationToken: token }
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/sign-in?error=invalid_or_used_token', url.origin)
      );
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL('/auth/sign-in?message=already_activated', url.origin)
      );
    }

    // Activate the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        activationToken: null,
        scheduledDeletion: null,
        loginAllowed: true,
        forumAllowed: true
      }
    });

    // Create session for the newly activated user
    await createSession(user.id);

    return NextResponse.redirect(
      new URL('/home?message=account_activated', url.origin)
    );

  } catch (error) {
    console.error("Account activation error:", error);
    return NextResponse.redirect(
      new URL('/auth/sign-in?error=activation_failed', url.origin)
    );
  }
}
