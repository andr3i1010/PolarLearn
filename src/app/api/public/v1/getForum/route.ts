"use server";
import { NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';

export async function GET(request: Request) {
    // Boilerplate code start hier
    const key = request.headers.get('Authorization');

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

    if (bot.resetToken && bot.resetToken < new Date()) {
        return NextResponse.json({ error: 'Token is verlopen, vraag een nieuwe aan' }, { status: 401 });
    }
    // Set initial reset limit if it doesn't exist or has expired
    const currentTime = new Date();
    if (!bot.resetLimit || bot.resetLimit < currentTime) {
        const nextResetTime = new Date();
        nextResetTime.setHours(nextResetTime.getHours() + 24);

        await prisma.bot.update({
            where: { token: key },
            data: { resetLimit: nextResetTime, limit: 100 },
        });

        // Update local bot object
        bot.resetLimit = nextResetTime;
        bot.limit = 100;
    }
    if (!bot.limit || bot.limit <= 0) {
        return NextResponse.json({ error: 'Bot heeft geen limiet of limiet is bereikt, je kan weer verzoeken doen op ' + bot.resetLimit }, { status: 403 });
    }
    bot.limit -= 1;
    await prisma.bot.update({
        where: { token: key },
        data: { limit: bot.limit },
    });

    let skip = Number(request.headers.get('skip'));
    if (!skip) {
        skip = 0
    }

    const forum = await prisma.forum.findMany({
        where: { type: "thread" },
        orderBy: { createdAt: "desc" },
        skip,
        take: 10,
    })
    console.log(forum)
    return NextResponse.json({ staat: 'OK', forum }, { status: 200 });
}
