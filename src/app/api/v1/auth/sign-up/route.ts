import { NextRequest, NextResponse } from "next/server";
import { createUserCredentials } from "@/utils/auth/user";
import { createSession } from "@/utils/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Alle velden zijn verplicht" },
        { status: 400 }
      );
    }

    // Validate username (no spaces)
    if (username.includes(" ")) {
      return NextResponse.json(
        { error: "Gebruikersnaam mag geen spaties bevatten" },
        { status: 400 }
      );
    }

    try {
      const result = await createUserCredentials(username, email, password) as any;

      if (result.success && result.userdata) {
        // Create session for the new user
        await createSession(result.userdata.id);

        return NextResponse.json(
          { success: true },
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
          { error: "Er bestaat al een account met dit email adres" },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error("Sign-up error:", error);
    return NextResponse.json(
      { error: "Interne serverfout" },
      { status: 500 }
    );
  }
}
