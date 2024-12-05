import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');

  if (!tokenCookie) {
    // User is not authenticated
    redirect('/sign-in');
  }

  // Include only the 'token' in the header string
  const cookieHeader = `token=${tokenCookie.value}`;

  // Make the request to /api/userdata with the 'token' cookie
  const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/userdata`;

  try {
    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // User is not authenticated
      redirect('/sign-in');
    }

    // Proceed with rendering
    return <>{children}</>;
  } catch (error) {
    // Handle errors and redirect if necessary
    redirect('/sign-in');
  }
}