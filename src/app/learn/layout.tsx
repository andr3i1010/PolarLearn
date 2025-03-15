import { redirect } from 'next/navigation';
import { auth } from '@/utils/auth';

export default async function Layout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session) {
        // User is not authenticated
        redirect('/auth/sign-in');
    }
    return children;
}