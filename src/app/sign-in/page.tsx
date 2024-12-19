// pages/sign-in.tsx (or wherever your login page is)
import { redirect } from 'next/navigation';
import Image from 'next/image';
import pl500 from '@/../public/pl-500.png';
import SignInForm from '@/app/sign-in/form';
import { RowDataPacket } from 'mysql2';
import { cookies } from 'next/headers';
import pool from '@/utils/mysql';

export default async function SignInPage() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token')?.value;

  const [rows]: [RowDataPacket[], any] = await pool.query('SELECT * FROM userdata WHERE token = ?', [tokenCookie]);

  if (rows.length > 0 && rows[0].token === tokenCookie) {
    // If token is valid, redirect to /home/start
    redirect('/home/start');
  }

  const loginPage = (
    <section className="bg-neutral-900 font-[family-name:var(--font-geist-sans)]">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="flex items-center mb-6 text-2xl font-semibold text-gray-900">
          <Image className="ml-4 px-3" src={pl500} alt="PolarLearn Logo" height="75" width="75" />
          <p className="text-center text-4xl font-extrabold leading-tight bg-gradient-to-r from-sky-400 to-sky-100 bg-clip-text text-transparent">
            PolarLearn
          </p>
        </div>
        <div className="w-full rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 bg-neutral-800 border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Log in
            </h1>
            <SignInForm />
          </div>
        </div>
      </div>
    </section>
  );

  if (!tokenCookie) {
    return loginPage;
  }

  return loginPage;
}
