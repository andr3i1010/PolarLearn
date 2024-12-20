// src/utils/checkDev.ts

import { cookies } from 'next/headers';
import pool from '@/utils/mysql';
import { RowDataPacket } from 'mysql2/promise';

export async function checkDev(): Promise<boolean> {  

  // Await the cookies() function to get the ReadonlyRequestCookies
  const cookieStore = await cookies();

  const token = cookieStore.get('token')?.value;

  if (!token) {
    return false;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT userType FROM userdata WHERE token = ?',
      [token]
    );

    if (rows.length === 0) {
      return false;
    }

    const userType = rows[0].userType;
    return userType === 'allowedDev' || userType === 'admin';
  } catch (error) {
    console.error('Error checking user type:', error);
    return false;
  }
}