import { signOut } from "@/utils/auth";
import { redirect } from "next/navigation";
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    await signOut()
    redirect("/auth/sign-in");
}