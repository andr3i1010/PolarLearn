import { NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { getUserFromSession } from '@/utils/auth/auth';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const user = await getUserFromSession(cookieStore.get('polarlearn.session-id')?.value);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { finishedTour: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error finishing tour:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
