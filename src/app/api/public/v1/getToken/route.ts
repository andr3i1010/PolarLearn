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
        select: { id: true, key: true },
    });

    if (!bot) {
        return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }
    if (bot) {
        const token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        const updatedBot = await prisma.bot.update({
            where: { key: key },
            data: { token: token, resetToken: expiresAt },
            select: { token: true, resetToken: true },
        });

        return NextResponse.json({ token: updatedBot.token, expiresAt: updatedBot.resetToken }, { status: 200 });
    }

    return NextResponse.json({ error: 'Failed to update bot' }, { status: 500 });
}
