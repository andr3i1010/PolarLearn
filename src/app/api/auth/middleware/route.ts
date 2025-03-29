import { NextResponse } from 'next/server';
import { notFound } from 'next/navigation';
import { decodeCookie } from '@/utils/auth/session';
import { prisma } from '@/utils/prisma';
import { cookies } from 'next/headers';
import { isLoggedIn } from '@/utils/auth/session';

export async function PATCH(req: Request) {
    const secretHeader = req.headers.get('x-internal-secret');

    if (!secretHeader || secretHeader !== process.env.PEPPER) {
        return NextResponse.redirect(new URL('/home/start', req.url))
    }
    const loggedIn = await isLoggedIn();
    return NextResponse.json({ logged_in: loggedIn }, { status: loggedIn ? 200 : 401 });
}
export async function GET(req: Request) {
    return NextResponse.redirect(new URL('/home/start', req.url))
}