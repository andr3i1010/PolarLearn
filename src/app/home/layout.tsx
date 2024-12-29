import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/utils/auth';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    // User is not authenticated
    redirect('/sign-in');
  }

}