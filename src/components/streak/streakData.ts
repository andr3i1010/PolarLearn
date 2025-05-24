"use server"

import { getUserFromSession } from '@/utils/auth/auth'
import { prisma } from '@/utils/prisma'
import { cookies } from 'next/headers'

export async function getFreezes() {
    const session = await getUserFromSession((await cookies()).get("polarlearn.session-id")?.value as string)
    const user = await prisma.user.findFirst({
        where: {
            id: session?.id
        }
    })
    return user?.freezeCount
}

export async function getStreak() {
    const session = await getUserFromSession((await cookies()).get("polarlearn.session-id")?.value as string)
    const user = await prisma.user.findFirst({
        where: {
            id: session?.id
        }
    })
    return user?.streakCount
}

export async function getWeekActivity() {
    const session = await getUserFromSession((await cookies()).get("polarlearn.session-id")?.value as string)
    if (!session?.id) return []

    const user = await prisma.user.findFirst({
        where: {
            id: session.id
        },
        select: {
            streakData: true
        }
    })

    // Get dates for the past 7 days
    const today = new Date()
    const pastWeek = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0] // Format as YYYY-MM-DD
    }).reverse() // Show oldest to newest (left to right)

    // Convert the streakData JSON to a usable format
    const streakData = user?.streakData as Record<string, string> || {}

    // Map the dates to statuses - only entries that exist in the database will be 'done' or 'frozen'
    return pastWeek.map(date => {
        const status = streakData[date] || 'none' // Default to 'none' if no data
        return { date, status }
    })
}

// Optimize getAllStreakData to use the data already returned by getUserFromSession
export async function getAllStreakData() {
    try {
        const sessionId = (await cookies()).get("polarlearn.session-id")?.value as string;
        // This is likely already fetching the full user profile
        const user = await getUserFromSession(sessionId);

        if (!user?.id) {
            return {
                streak: 0,
                freezes: 0,
                weekActivity: []
            };
        }

        // Check if getUserFromSession already includes the data we need
        let streakCount = user.streakCount;
        let freezeCount = user.freezeCount;
        let streakData = user.streakData;
        let lastActivity = user.lastActivity;

        // If the session user doesn't include complete data, then fetch only what's missing
        if (streakCount === undefined || freezeCount === undefined || streakData === undefined || lastActivity === undefined) {
            // Only fetch what we're missing
            const userData = await prisma.user.findFirst({
                where: {
                    id: user.id
                },
                select: {
                    streakCount: streakCount === undefined,
                    freezeCount: freezeCount === undefined,
                    streakData: streakData === undefined,
                    lastActivity: lastActivity === undefined
                }
            });

            if (userData) {
                streakCount = streakCount ?? userData.streakCount;
                freezeCount = freezeCount ?? userData.freezeCount;
                streakData = streakData ?? userData.streakData;
                lastActivity = lastActivity ?? userData.lastActivity;
            }
        }

        // Get dates for the past 7 days
        const today = new Date();
        const pastWeek = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        }).reverse();

        // Convert the streakData JSON to a usable format
        const streakDataObj = streakData as Record<string, string> || {};

        // Map the dates to statuses
        const weekActivity = pastWeek.map(date => {
            const status = streakDataObj[date] || 'none';
            return { date, status };
        });

        // Check if streak should be reset due to missed days
        let finalStreakCount = streakCount || 0;

        // Get yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Get day before yesterday's date (to check for freezes)
        const dayBeforeYesterday = new Date();
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        const dayBeforeYesterdayStr = dayBeforeYesterday.toISOString().split('T')[0];

        // Today's date in YYYY-MM-DD format
        const todayStr = new Date().toISOString().split('T')[0];

        // Check if we have activity from today or yesterday
        const hasActivityToday = streakDataObj[todayStr] === 'done' || streakDataObj[todayStr] === 'frozen';
        const hadYesterdayActivity = streakDataObj[yesterdayStr] === 'done' || streakDataObj[yesterdayStr] === 'frozen';
        const hadDayBeforeYesterdayActivity = streakDataObj[dayBeforeYesterdayStr] === 'done' || streakDataObj[dayBeforeYesterdayStr] === 'frozen';

        // Streak should be reset only if:
        // 1. User has a streak count > 0
        // 2. User has no activity today AND had no activity yesterday
        if (!hasActivityToday && !hadYesterdayActivity && finalStreakCount > 0) {
            // User missed a day - reset streak
            // We don't actually update the database here, just what we return
            // Next time updateDailyStreak is called, it will properly reset
            finalStreakCount = 0;
        }

        return {
            streak: finalStreakCount,
            freezes: freezeCount || 0,
            weekActivity
        };
    } catch (error) {
        console.error("Error fetching all streak data:", error);
        return {
            streak: 0,
            freezes: 0,
            weekActivity: []
        };
    }
}