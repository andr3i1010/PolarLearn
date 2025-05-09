"use server"

import { getUserFromSession } from '@/utils/auth/auth'
import { prisma } from '@/utils/prisma'
import { cookies } from 'next/headers'

type StreakUpdateResult = {
    success: boolean;
    streakUpdated?: boolean;
    currentStreak?: number;
    isNewStreak?: boolean;
    freezeAwarded?: boolean;
    freezeUsed?: boolean;
    message?: string;
}

export async function updateDailyStreak(): Promise<StreakUpdateResult> {
    const session = await getUserFromSession((await cookies()).get("polarlearn.session-id")?.value as string)
    if (!session?.id) return { success: false, message: "Niet ingelogd" }

    try {
        // Get the current date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0]

        // Get the user and their current streak data
        const user = await prisma.user.findFirst({
            where: { id: session.id },
            select: {
                streakCount: true,
                streakData: true,
                lastActivity: true,
                freezeCount: true
            }
        })

        if (!user) return { success: false, message: "Gebruiker niet gevonden" }

        // Convert streak data to a usable format
        const streakData = user.streakData as Record<string, string> || {}

        // Check if user already has activity for today
        if (streakData[today] === 'done') {
            return {
                success: true,
                streakUpdated: false,
                currentStreak: user.streakCount,
                isNewStreak: false
            }
        }

        // Calculate yesterday's date
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        // Check streak continuity
        const hadYesterdayActivity = streakData[yesterdayStr] === 'done' || streakData[yesterdayStr] === 'frozen'

        // Track if we need to use a freeze
        let freezeUsed = false

        // If we missed yesterday but have freezes, use one
        if (!hadYesterdayActivity && user.freezeCount > 0 && user.streakCount > 0) {
            // Apply the freeze to yesterday
            streakData[yesterdayStr] = 'frozen'
            freezeUsed = true
        }

        // Rechecking continuity with potential freeze
        const continuousStreak = freezeUsed || streakData[yesterdayStr] === 'done' || streakData[yesterdayStr] === 'frozen'
        const isNewStreak = !user.lastActivity || !continuousStreak

        // Update streak count
        let newStreakCount = user.streakCount || 0

        if (isNewStreak) {
            // Start a new streak
            newStreakCount = 1
        } else {
            // Continue streak
            newStreakCount = newStreakCount + 1
        }

        // Check if a streak freeze should be awarded (every 3 days)
        // Only award for continuous streaks, not for streak restarts
        const freezeAwarded = !isNewStreak && newStreakCount % 3 === 0

        // Calculate new freeze count
        const newFreezeCount = (
            (freezeAwarded ? 1 : 0) + // Add one if a freeze was awarded
            (freezeUsed ? -1 : 0) +   // Subtract one if a freeze was used
            (user.freezeCount || 0)    // Start with current count
        );

        // Update the streakData with today's activity
        streakData[today] = 'done'

        // Clean up old streak data - keep only the last 30 days
        const cleanedStreakData: Record<string, string> = {};

        // Get all dates in the past 30 days (for streak tracking) + yesterday (if we applied a freeze)
        const dateKeys = Object.keys(streakData).sort();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        // Only keep entries from the last 30 days
        for (const dateKey of dateKeys) {
            // Keep dates from the last 30 days or if it's yesterday and we just applied a freeze
            if (dateKey >= thirtyDaysAgoStr ||
                (freezeUsed && dateKey === yesterdayStr)) {
                cleanedStreakData[dateKey] = streakData[dateKey];
            }
        }

        // Update user record
        await prisma.user.update({
            where: { id: session.id },
            data: {
                streakCount: newStreakCount,
                streakData: cleanedStreakData,  // Use the cleaned data
                lastActivity: new Date(),
                freezeCount: newFreezeCount
            }
        })

        return {
            success: true,
            streakUpdated: true,
            currentStreak: newStreakCount,
            isNewStreak: isNewStreak,
            freezeAwarded: freezeAwarded,
            freezeUsed: freezeUsed
        }
    } catch (error) {
        console.error("Error updating streak:", error)
        return { success: false, message: "Fout bij het bijwerken van streak" }
    }
}