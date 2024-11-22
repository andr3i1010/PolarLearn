import { NextRequest, NextResponse } from 'next/server';
import pool from '@/utils/mysql';
import { RowDataPacket } from 'mysql2';

export const GET = async (req: NextRequest) => {
    try {
        const token = req.cookies.get('token');

        if (!token) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        // Query the database to get the user based on the token
        const [rows] = await pool.query<RowDataPacket[]>('SELECT username FROM userdata WHERE token = ?', [token]);
        const user = rows[0];

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, username: user.username });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
};