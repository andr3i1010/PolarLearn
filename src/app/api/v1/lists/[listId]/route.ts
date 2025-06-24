import { NextResponse } from 'next/server';
import { createListAction } from '@/serverActions/createList';

export async function PUT(request: Request, { params }: { params: Promise<{ listId: string }> }) {
  // Await params to extract the dynamic listId
  const { listId } = await params;
  try {
    const bodyData = await request.json();
    const listData = { ...bodyData, listId };

    const result = await createListAction(listData);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error in PUT /api/v1/lists/${listId}`, error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
