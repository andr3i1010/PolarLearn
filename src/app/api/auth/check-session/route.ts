import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/utils/auth/auth";
import { isLoggedIn } from "@/utils/auth/session";

export async function GET() {
    try {
        const sessionCookie = (await cookies()).get("polarlearn.session-id");

        if (!sessionCookie?.value) {
            return NextResponse.json(
                { authenticated: false },
                {
                    status: 401,
                    headers: {
                        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                }
            );
        }

        // First check if the session is valid at all
        const isValid = await isLoggedIn();
        if (!isValid) {
            return NextResponse.json(
                { authenticated: false },
                {
                    status: 401,
                    headers: {
                        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                }
            );
        }

        // Then get the user if the session is valid
        const user = await getUserFromSession(sessionCookie.value);
        if (!user) {
            return NextResponse.json(
                { authenticated: false },
                {
                    status: 401,
                    headers: {
                        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                }
            );
        }

        return NextResponse.json(
            { authenticated: true, user: { name: user.name } },
            {
                headers: {
                    // Completely disable caching for auth responses
                    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            }
        );
    } catch (error) {
        console.error("Error checking session:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store, max-age=0',
                    'Pragma': 'no-cache'
                }
            }
        );
    }
}
