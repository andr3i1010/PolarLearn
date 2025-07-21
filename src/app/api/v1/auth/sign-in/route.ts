import { signInCredentials } from "@/utils/auth/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, captchaToken, turnstileEnabled = true } = body;
    // Only require captcha if turnstileEnabled is true (default)
    if (turnstileEnabled) {
      if (!captchaToken) {
        return NextResponse.json({ error: "Captcha verificatie vereist" }, { status: 400 });
      }
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY || "",
          response: captchaToken,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json({ error: "Ongeldige captcha" }, { status: 400 });
      }
    }
    if (!email || !password) {
      return NextResponse.json(
        { error: "email of wachtwoord mist" },
        { status: 400 }
      );
    }

    const result = await signInCredentials(email, password);

    if (result === "invcreds") {
      return NextResponse.json(
        { error: "ongeldige inloggegevens" },
        { status: 401 }
      );
    }

    if (result === "email_not_verified") {
      return NextResponse.json(
        { error: "Je e-mailadres is nog niet geverifieerd. Controleer je e-mail en klik op de activatielink. Als je geen e-mail binnenkrijgt, join onze Discord voor hulp." },
        { status: 403 }
      );
    }

    if (typeof result === "string" && result !== "invcreds") {
      // This is a ban reason
      return NextResponse.json(
        { error: result },
        { status: 403 }
      );
    }

    if (result === true) {
      // On successful sign-in, return JSON with optional 'goto' path for client redirect
      const gotoCookie = request.cookies.get("polarlearn.goto");
      const response = NextResponse.json(
        { success: true, goto: gotoCookie?.value },
        { status: 200 }
      );
      if (gotoCookie) {
        response.cookies.delete("polarlearn.goto");
      }
      return response;
    }

    return NextResponse.json(
      { error: "Interne serverfout" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Sign-in error:", error);
    return NextResponse.json(
      { error: "Interne serverfout" },
      { status: 500 }
    );
  }
}
