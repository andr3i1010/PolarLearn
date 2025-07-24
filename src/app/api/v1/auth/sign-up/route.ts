import { NextRequest, NextResponse } from "next/server";
import { createUserCredentials } from "@/utils/auth/user";
import disposable from 'disposable-email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, captchaToken } = body;

    // Only require captcha if turnstileEnabled is true (default)
    if (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !!process.env.TURNSTILE_SECRET_KEY) {
      if (!captchaToken) {
        return NextResponse.json(
          { error: "Captcha verificatie vereist" },
          { status: 400 }
        );
      }

      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET_KEY || "",
            response: captchaToken,
          }),
        }
      );
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json({ error: "Ongeldige captcha" }, { status: 400 });
      }
    }

    // Use destructured username, email, and password from body directly

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Alle velden zijn verplicht" },
        { status: 400 }
      );
    }

    // Validate username (only allow alphanumeric characters, dots, and underscores)
    const validUsernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!validUsernameRegex.test(username)) {
      return NextResponse.json(
        { error: "Gebruikersnaam mag alleen letters, cijfers, punten en underscores bevatten" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "Gebruikersnaam moet tussen de 3 en 20 tekens zijn" },
        { status: 400 }
      );
    }

    if (email.length < 5 || email.length > 100) {
      return NextResponse.json(
        { error: "Email moet tussen de 5 en 100 tekens zijn" },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 100) {
      return NextResponse.json(
        { error: "Wachtwoord moet tussen de 8 en 100 tekens zijn" },
        { status: 400 }
      );
    }

    if (password.includes(username)) {
      return NextResponse.json(
        { error: "Wachtwoord mag niet de gebruikersnaam bevatten" },
        { status: 400 }
      );
    }

    // if (disposable.validate(email)) {
    //   return NextResponse.json(
    //     { error: "Tijdelijke email adressen zijn niet toegestaan" },
    //     { status: 400 }
    //   );
    // }

    try {
      const result = (await createUserCredentials(
        username,
        email,
        password
      )) as any;

      if (result.success && result.userdata) {
        // Don't create session for unverified users
        // await createSession(result.userdata.id);

        return NextResponse.json(
          {
            success: true,
            message: "Account aangemaakt! Controleer je e-mail om je account te activeren."
          },
          { status: 201 }
        );
      } else {
        return NextResponse.json(
          { error: "Fout bij aanmaken account" },
          { status: 500 }
        );
      }
    } catch (err: any) {
      if (err.error === "userexists") {
        return NextResponse.json(
          { error: "Er bestaat al een account met dit gebruikersnaam of emailadres" },
          { status: 409 }
        );
      }
      if (err.error === "email_send_failed") {
        return NextResponse.json(
          { error: "Fout bij het versturen van de activatie-email. Probeer het opnieuw." },
          { status: 500 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error("Sign-up error:", error);
    return NextResponse.json(
      { error: "🚨 Interne serverfout" },
      { status: 500 }
    );
  }
}
