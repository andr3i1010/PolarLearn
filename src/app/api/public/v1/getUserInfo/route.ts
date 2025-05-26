"use server";
import { NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';

export async function GET(request: Request) {
    // Boilerplate code start hier
    const key = request.headers.get('token');

    if (!key) {
        return NextResponse.json({ error: 'Geen token opgegeven' }, { status: 400 });
    }
    // check of de token geldig is
    const bot = await prisma.bot.findUnique({
        where: { token: key },
    });
    if (!bot) {
        return NextResponse.json({ error: 'Bot niet gevonden of token ongeldig' }, { status: 404 });
    }
    if (bot.resetToken < new Date()) {
        return NextResponse.json({ error: 'Token is verlopen, vraag een nieuwe aan' }, { status: 401 });
    }
    if (!bot.resetLimit || bot.resetLimit < new Date()) {
        const nextResetTime = new Date();
        nextResetTime.setHours(nextResetTime.getHours() + 24);

        await prisma.bot.update({
            where: { token: key },
            data: { resetLimit: nextResetTime, limit: 100 },
        });
    }
    if (!bot.limit || bot.limit <= 0) {
        return NextResponse.json({ error: 'Bot heeft geen limiet of limiet is bereikt, je kan weer verzoeken doen op ' + bot.resetLimit }, { status: 403 });
    }
    bot.limit -= 1;
    await prisma.bot.update({
        where: { token: key },
        data: { limit: bot.limit },
    });

    // Boilerplate code eindigt hier
    const userName = request.headers.get('UserName');
    if (!userName) {
        return NextResponse.json({ error: 'Geen gebruikersnaam opgegeven' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({
        where: { name: userName },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
            forumPoints: true,
            list_data: true,
            streakCount: true,
        }
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
}
