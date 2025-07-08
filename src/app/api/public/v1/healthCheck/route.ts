"use server";
import { NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';

export async function GET(request: Request) {
    try {
        await prisma.user.findFirst({
            where: {
                forumAllowed: true,
            }
        });

        // Return plain text response
        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        // Return plain text error instead of JSON
        return new NextResponse("Database error", { status: 500 });
    }
}