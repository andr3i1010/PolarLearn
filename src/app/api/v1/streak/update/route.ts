import { updateDailyStreak } from '@/components/streak/updateStreak';
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const result = await updateDailyStreak();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating streak via updateDailyStreak:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
