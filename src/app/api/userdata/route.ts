// src/app/api/userdata/route.ts

import { NextResponse } from 'next/server';
import { checkDev } from '@/utils/checkdev';
import pool from '@/utils/mysql';
import { RowDataPacket } from 'mysql2/promise';
import { cookies } from 'next/headers'; // Ensure proper import

export async function GET(request: Request) {
  const hasDevAccess = await checkDev();

  if (!hasDevAccess) {
    const response = NextResponse.json(
      { success: false, message: 'Access denied or token expired' },
      { status: 403 }
    );

    // Delete the 'token' cookie by setting it with an expired date
    response.cookies.set('token', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  }

  try {
    const userData = await fetchUserData();
    return NextResponse.json(
      { success: true, user: userData },
      { status: 200 }
    );
  } catch (error: any) { // Use 'any' or define a proper error type
    console.error('Error fetching user data:', error.message);

    // Determine the error type to set appropriate status code
    if (error.message === 'User not found' || error.message === 'Token not found') {
      // Optionally, delete the token cookie if it's invalid
      const response = NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );

      response.cookies.set('token', '', {
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return response;
    }

    // For other unexpected errors
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function fetchUserData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    throw new Error('Token not found');
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT uuid, email, username FROM userdata WHERE token = ?',
    [token]
  );

  if (rows.length === 0) {
    throw new Error('User not found');
  }

  return rows[0];
}