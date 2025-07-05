import { NextResponse } from 'next/server';
import { addListToGroup, removeListFromGroup } from '@/serverActions/groupActions';

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  try {
    const { listId } = await request.json();
    await addListToGroup(groupId, listId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error in POST /api/v1/groups/${groupId}/lists`, error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE handler to remove list from group
export async function DELETE(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  try {
    const { listId } = await request.json();
    await removeListFromGroup(groupId, listId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error in DELETE /api/v1/groups/${groupId}/lists`, error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
