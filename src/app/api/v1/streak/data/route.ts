import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from '@/utils/auth/auth';
import { prisma } from '@/utils/prisma';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const sessionId = (await cookies()).get("polarlearn.session-id")?.value as string;
    const user = await getUserFromSession(sessionId);

    if (!user?.id) {
      return NextResponse.json(
        {
          success: true,
          data: {
            streak: 0,
            freezes: 0,
            weekActivity: []
          }
        },
        { status: 200 }
      );
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

    return NextResponse.json(
      {
        success: true,
        data: {
          streak: finalStreakCount,
          freezes: freezeCount || 0,
          weekActivity
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching streak data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Fout bij het ophalen van streak gegevens"
      },
      { status: 500 }
    );
  }
}
