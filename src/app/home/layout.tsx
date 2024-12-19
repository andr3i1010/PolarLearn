import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import pool from '@/utils/mysql'
import { RowDataPacket } from 'mysql2';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token')?.value;
  const [rows]: [RowDataPacket[], any] = await pool.query('SELECT * FROM userdata WHERE token = ?', [tokenCookie]);
  const user = rows[0];

  if (!tokenCookie) {
    // User is not authenticated
    redirect('/sign-in');
  }

  try {
    const response = user.token == tokenCookie;
    if (!response) {
      redirect('/sign-in')
    }

    // Proceed with rendering
    return <>{children}</>;
  } catch (error) {
    // Handle errors and redirect if necessary
    console.log('Interne serverfout: ' + error)
    redirect('/sign-in')
  }
}