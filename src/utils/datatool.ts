import { cookies } from 'next/headers';
import pool from '@/utils/mysql';
import { RowDataPacket } from 'mysql2/promise';
import { execSync } from 'child_process';

interface User {
  uuid: string;
  email: string;
  username: string;
  // Include any other necessary properties
}


export async function checkDev(): Promise<boolean> {
    if (process.env.ALLOW_EVERYONE_ON_DEV == "true") {
      return true
    }
  
    // Await the cookies() function to get the ReadonlyRequestCookies
    const cookieStore = await cookies();
  
    const token = cookieStore.get('token')?.value;
  
    if (!token) {
      return false;
    }
  
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT user_type FROM userdata WHERE token = ?',
        [token]
      );
  
      if (rows.length === 0) {
        return false;
      }
  
      const userType = rows[0].user_type;
      return userType === 'allowedDev' || userType === 'admin';
    } catch (error) {
      console.error('Error checking user type:', error);
      return false;
    }
}

export async function gitInfo() {
  try {
    const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    return `${gitCommit}@${gitBranch}`;
  } catch (error) {
    console.error('Fout bij het ophalen van git info:', error);
    return 'error';
  }
}

export async function userInfo(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null; // No token means user is not logged in
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT uuid, email, username FROM userdata WHERE token = ?',
      [token]
    );

    if (rows.length === 0) {
      return null; // Invalid token
    }

    // Create a User object from the database result
    const user: User = {
      uuid: rows[0].uuid,
      email: rows[0].email,
      username: rows[0].username,
      // Include any other necessary properties
    };

    return user;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null; // Return null on error
  }
}

async function lists() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    throw new Error('Token not found');
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT list_data FROM userdata WHERE token = ?',
    [token]
  );

  if (rows.length === 0) {
    throw new Error('User not found');
  }

  return rows[0];
}