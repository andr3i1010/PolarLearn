import { signInCredentials } from "@/utils/auth/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL && process.env.NEXT_PUBLIC_URL.trim() !== ""
      ? process.env.NEXT_PUBLIC_URL
      : "http://localhost:3000";
    const body = await request.json();
    const { email, password, captchaToken } = body;
    // Verify captcha token
    if (!captchaToken) {
      return NextResponse.json({ error: "Captcha verificatie vereist" }, { status: 400 });
    }
    console.log("secret ", process.env.TURNSTILE_SECRET_KEY)
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

    if (typeof result === "string" && result !== "invcreds") {
      // This is a ban reason
      return NextResponse.json(
        { error: result },
        { status: 403 }
      );
    }

    if (result === true) {
      const res =  NextResponse.json(
        { success: true },
        { status: 200 }
      );
      const gotoCookie = request.cookies.get("polarlearn.goto")
      if (gotoCookie) {
        const response = NextResponse.redirect(new URL(gotoCookie.value, baseUrl));
        response.cookies.delete("polarlearn.goto");
        return response;
      }
      return res;
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
