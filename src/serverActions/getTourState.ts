'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/utils/prisma';
import { getUserFromSession } from '@/utils/auth/auth';

export async function getTourState() {
  const sessionCookie = (await cookies()).get('polarlearn.session-id')?.value;
  if (!sessionCookie) {
    return { finishedTour: false };
  }
  const user = await getUserFromSession(sessionCookie);
  if (!user) {
    return { finishedTour: false };
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { finishedTour: true },
  });
  return { finishedTour: dbUser?.finishedTour ?? false };
}
