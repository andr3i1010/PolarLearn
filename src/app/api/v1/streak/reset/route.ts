import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from '@/utils/auth/auth';
import { prisma } from '@/utils/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const sessionId = (await cookies()).get("polarlearn.session-id")?.value as string;
    const session = await getUserFromSession(sessionId);

    if (!session?.id) {
      return NextResponse.json(
        { success: false, message: "Niet ingelogd" },
        { status: 401 }
      );
    }

    // Get the user and their current streak data
    const user = await prisma.user.findFirst({
      where: { id: session.id },
      select: {
        streakCount: true,
        streakData: true,
        lastActivity: true,
        freezeCount: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    if (!user.streakCount) {
      return NextResponse.json(
        { success: false, message: "Geen streak om te resetten" },
        { status: 400 }
      );
    }

    // Get the current date and yesterday's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Convert streak data to a usable format
    const streakData = user.streakData as Record<string, string> || {};

    // Check if user has activity for today or yesterday
    const hasTodayActivity = streakData[today] === 'done' || streakData[today] === 'frozen';
    const hadYesterdayActivity = streakData[yesterdayStr] === 'done' || streakData[yesterdayStr] === 'frozen';

    // If the user has no activity for yesterday and no activity for today, the streak is broken
    if (!hasTodayActivity && !hadYesterdayActivity && user.streakCount > 0) {
      // Reset streak count in the database
      await prisma.user.update({
        where: { id: session.id },
        data: {
          streakCount: 0,
          // Keep the streak data as is, so we still show the history
        }
      });

      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting streak:", error);
    return NextResponse.json(
      { success: false, message: "Fout bij het resetten van de streak" },
      { status: 500 }
    );
  }
}
