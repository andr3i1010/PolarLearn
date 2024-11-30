import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/utils/mysql';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

const JWT_SIGNING_KEY = process.env.JWT_SIGNING_KEY as string;

export const POST = async (req: NextRequest) => {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
        }

        // Query the database to get the user based on the email
        const [rows]: [RowDataPacket[], any] = await pool.query('SELECT * FROM userdata WHERE email = ?', [email]);
        const user = rows[0];

        if (!user) {
            return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
        }

        // Hash the provided password with the stored salt
        const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');

        if (hash !== user.passwordHash) {
            return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
        }

        // Generate a JWT token
        const token = jwt.sign({ id: user.uuid, email: user.email }, JWT_SIGNING_KEY, { expiresIn: '2h' });

        // Store the token in the database
        await pool.query('UPDATE userdata SET token = ? WHERE uuid = ?', [token, user.uuid]);

        // Create the response and set the token as a cookie
        const response = NextResponse.json({ success: true, redirectUrl: '/' });
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 60 * 60 * 2
        });

        return response;
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
};