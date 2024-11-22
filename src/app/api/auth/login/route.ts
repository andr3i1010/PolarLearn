import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/utils/mysql';
import { RowDataPacket } from 'mysql2';
import jwt from 'jsonwebtoken';

type User = {
    id: number;
    email: string;
    passwordHash: string;
    salt: string;
};

const JWT_SIGNING_KEY = process.env.JWT_SIGNING_KEY;

if (!JWT_SIGNING_KEY) {
    throw new Error('JWT_SIGNING_KEY is not defined');
}

export const POST = async (req: NextRequest) => {
    try {
        const { email, password, stayLoggedIn } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
        }

        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM userdata WHERE email = ?', [email]);
        const user = rows[0] as User;

        if (!user || !user.passwordHash || !user.salt) {
            return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
        }

        const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');

        if (hash !== user.passwordHash) {
            return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SIGNING_KEY, { expiresIn: '2h' });

        // Store the token in the database
        await pool.query('UPDATE userdata SET token = ? WHERE id = ?', [token, user.id]);

        const response = NextResponse.json({ success: true, redirectUrl: '/' });
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: stayLoggedIn ? 60 * 60 * 24 * 7 : 0,
        });

        return response;
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
};