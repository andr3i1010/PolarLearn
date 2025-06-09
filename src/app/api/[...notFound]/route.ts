import { NextRequest, NextResponse } from 'next/server'

export function handler(req: NextRequest) {
    return NextResponse.json(
        { error: 'Not Found', message: 'This API route does not exist.' },
        { status: 404 }
    )
}

// Route all methods through handler
export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
export const OPTIONS = handler
export const HEAD = handler
export function SOCKET(req: NextRequest) {
    return new NextResponse('idioot', { status: 404 })
}