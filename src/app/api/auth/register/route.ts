import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/utils/mysql';
import { v4 as uuidv4 } from 'uuid';

export const POST = async (req: NextRequest) => {
    try {
        const { username, email, password } = await req.json();

        if (!username || !email || !password) {
            return NextResponse.json({ success: false, message: 'Username, email, and password are required' }, { status: 400 });
        }

        // Check if the user already exists
        const [rows]: any = await pool.query('SELECT * FROM userdata WHERE username = ?', [username]);
        if (rows.length > 0) {
            return NextResponse.json({ success: false, message: 'Username already exists' }, { status: 400 });
        }

        // Generate UUID for the user
        const userId = uuidv4();

        // Generate salt
        const salt = crypto.randomBytes(16).toString('hex');

        // Hash the password with the salt
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

        // Set default usertype
        const usertype = 'default';
        const defaultListValue = '{"recent_subjects": [], "recent_lists": [], "all_lists_practiced": [], "lists_created": []}';

        // Insert user into the database with UUID, salt, hashed password, and default usertype
        await pool.query('INSERT INTO userdata (uuid, username, email, password_hash, salt, user_type, list_data) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, username, email, hash, salt, usertype, defaultListValue]);

        return NextResponse.json({ success: true, message: 'User registered successfully', redirectUrl: '/home/start' }, { status: 201 });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
};