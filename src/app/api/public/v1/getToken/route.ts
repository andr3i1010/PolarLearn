"use server";
import { NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
    const key = request.headers.get('key');

    if (!key) {
        return NextResponse.json({ error: 'Key missing' }, { status: 400 });
    }
    const bot = await prisma.bot.findUnique({
        where: { key: key },
    });

    if (!bot) {
        return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }
    if (bot) {
        bot.token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        await prisma.bot.update({
            where: { key: key },
            data: { token: bot.token, resetToken: expiresAt },
        });
    }

    return NextResponse.json({ token: bot.token, expiresAt: bot.resetToken }, { status: 200 });
}
