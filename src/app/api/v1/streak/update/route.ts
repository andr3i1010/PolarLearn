import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth/auth";
import { prisma } from "@/utils/prisma";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const sessionId = (await cookies()).get("polarlearn.session-id")?.value as string;
    const user = await getUserFromSession(sessionId);

    if (!user?.id) {
      return NextResponse.json(
        { error: "Niet ingelogd" },
        { status: 401 }
      );
    }

    // Get the current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get the user and their current streak data
    const userData = await prisma.user.findFirst({
      where: { id: user.id },
      select: {
        streakCount: true,
        streakData: true,
        lastActivity: true,
        freezeCount: true
      }
    });

    if (!userData) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Convert streak data to a usable format
    const streakData = userData.streakData as Record<string, string> || {};

    // Check if user already has activity for today
    if (streakData[today] === 'done') {
      return NextResponse.json({
        success: true,
        streakUpdated: false
      });
    }

    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check streak continuity
    const hadYesterdayActivity = streakData[yesterdayStr] === 'done' || streakData[yesterdayStr] === 'frozen';

    // Track if we need to use a freeze
    let freezeUsed = false;

    // If we missed yesterday but have freezes, use one
    if (!hadYesterdayActivity && userData.freezeCount > 0 && userData.streakCount > 0) {
      // Apply the freeze to yesterday
      streakData[yesterdayStr] = 'frozen';
      freezeUsed = true;
    }

    // Rechecking continuity with potential freeze
    const continuousStreak = freezeUsed || streakData[yesterdayStr] === 'done' || streakData[yesterdayStr] === 'frozen';
    const isNewStreak = !userData.lastActivity || !continuousStreak;

    // Update streak count
    let newStreakCount = userData.streakCount || 0;

    if (isNewStreak) {
      // Start a new streak
      newStreakCount = 1;
    } else {
      // Continue streak
      newStreakCount = newStreakCount + 1;
    }

    // Check if a streak freeze should be awarded (every 3 days)
    // Only award for continuous streaks, not for streak restarts
    const freezeAwarded = !isNewStreak && newStreakCount % 3 === 0;

    // Calculate new freeze count
    const newFreezeCount = (
      (freezeAwarded ? 1 : 0) + // Add one if a freeze was awarded
      (freezeUsed ? -1 : 0) +   // Subtract one if a freeze was used
      (userData.freezeCount || 0)    // Start with current count
    );

    // Update the streakData with today's activity
    streakData[today] = 'done';

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
      where: { id: user.id },
      data: {
        streakCount: newStreakCount,
        streakData: cleanedStreakData,  // Use the cleaned data
        lastActivity: new Date(),
        freezeCount: newFreezeCount
      }
    });

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error("Error updating streak:", error);
    return NextResponse.json(
      { error: "Fout bij het bijwerken van streak" },
      { status: 500 }
    );
  }
}
