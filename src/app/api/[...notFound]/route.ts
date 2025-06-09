import { NextRequest, NextResponse } from 'next/server'

// Create the response handler without exporting it
function createNotFoundResponse(req: NextRequest) {
    return NextResponse.json(
        { error: 'Not Found', message: 'This API route does not exist.' },
        { status: 404 }
    )
}

// Export route handlers directly
export const GET = (req: NextRequest) => createNotFoundResponse(req)
export const POST = (req: NextRequest) => createNotFoundResponse(req)
export const PUT = (req: NextRequest) => createNotFoundResponse(req)
export const DELETE = (req: NextRequest) => createNotFoundResponse(req)
export const PATCH = (req: NextRequest) => createNotFoundResponse(req)
export const OPTIONS = (req: NextRequest) => createNotFoundResponse(req)
export const HEAD = (req: NextRequest) => createNotFoundResponse(req)
export function SOCKET(req: NextRequest) {
    return new NextResponse('idioot', { status: 404 })
}