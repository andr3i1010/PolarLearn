import { NextResponse } from 'next/server';
import { isLoggedIn } from '@/utils/auth/session';

export async function PATCH(req: Request) {
    const secretHeader = req.headers.get('x-internal-secret');

    if (!secretHeader || secretHeader !== process.env.PEPPER) {
        return NextResponse.redirect(new URL('/home/start', req.url))
    }
    const loggedIn = await isLoggedIn();
    return NextResponse.json({ logged_in: loggedIn ? true : false}, { status: loggedIn ? 200 : 401 });
}
export async function GET(req: Request) {
    return NextResponse.redirect(new URL('/home/start', req.url))
}