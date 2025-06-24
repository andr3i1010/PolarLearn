import { signInCredentials } from "@/utils/auth/auth";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL && process.env.NEXT_PUBLIC_URL.trim() !== ""
      ? process.env.NEXT_PUBLIC_URL
      : "http://localhost:3000";
    const body = await request.json();
    const { email, password } = body;

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
