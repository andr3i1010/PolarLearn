import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { sendSignUpEmail } from "@/utils/auth/user";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "E-mailadres is vereist" },
        { status: 400 }
      );
    }

    // Find user with the email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        {
          success: true,
          message: "Als er een account bestaat met dit e-mailadres, wordt er een nieuwe activatie-email verstuurd."
        },
        { status: 200 }
      );
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Dit account is al geactiveerd" },
        { status: 400 }
      );
    }

    // Generate new activation token
    const newActivationToken = crypto.randomBytes(32).toString("hex");

    // Extend scheduled deletion by 24 hours
    const newScheduledDeletion = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update user with new token and extended deletion time
    await prisma.user.update({
      where: { id: user.id },
      data: {
        activationToken: newActivationToken,
        scheduledDeletion: newScheduledDeletion
      }
    });

    // Send new activation email
    try {
      await sendSignUpEmail(email, user.name || 'Gebruiker', newActivationToken);

      return NextResponse.json(
        {
          success: true,
          message: "Een nieuwe activatie-email is verstuurd naar je e-mailadres."
        },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Error sending activation email:", emailError);
      return NextResponse.json(
        { error: "Fout bij het versturen van de activatie-email. Probeer het later opnieuw." },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Resend activation error:", error);
    return NextResponse.json(
      { error: "🚨 Interne serverfout" },
      { status: 500 }
    );
  }
}
