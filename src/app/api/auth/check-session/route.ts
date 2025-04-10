import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/utils/auth/auth";
import { logOut } from "@/utils/auth/session";

export async function GET() {
    try {
        const sessionCookie = (await cookies()).get("polarlearn.session-id");

        if (!sessionCookie?.value) {
            await logOut();
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

        const user = await getUserFromSession(sessionCookie.value);

        if (!user) {
            await logOut();
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
                    // Use a short-lived cache to reduce API calls while maintaining security
                    'Cache-Control': 'private, max-age=60'
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
