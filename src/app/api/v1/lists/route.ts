import { NextResponse } from 'next/server';
import { createListAction } from '@/serverActions/createList';

export async function POST(request: Request) {
  try {
    const listData = await request.json();
    const result = await createListAction(listData);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/v1/lists', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
