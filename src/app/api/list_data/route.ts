import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { auth } from '@/utils/auth';

export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id');
    console.log(id);

    const session = await auth();
    if (!session?.user?.name || !session?.user?.email) {
        throw new Error("User not authenticated");
    }

    if (!id) {
        return NextResponse.json({ error: "No list ID provided" }, { status: 400 });
    }

    const listData = await prisma.practice.findFirst({
        where: {
            list_id: id
        }
    });

    if (!listData) {
        return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json(listData);
}
