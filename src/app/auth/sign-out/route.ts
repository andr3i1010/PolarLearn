import { logOut } from "@/utils/auth/session";
import { redirect } from "next/navigation";
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    await logOut()
    redirect("/auth/sign-in");
}   