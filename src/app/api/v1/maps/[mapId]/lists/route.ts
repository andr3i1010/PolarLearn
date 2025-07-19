import { NextResponse } from 'next/server';
import { addListToMap, removeListFromMap } from '@/serverActions/mapActions';

export async function POST(request: Request, { params }: { params: Promise<{ mapId: string }> }) {
  const { mapId } = await params;
  try {
    const { listId } = await request.json();
    const result = await addListToMap(mapId, listId);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error || 'Failed to add list to map' }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`Error in POST /api/v1/maps/${mapId}/lists`, error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE handler to remove list from map
export async function DELETE(request: Request, { params }: { params: Promise<{ mapId: string }> }) {
  const { mapId } = await params;
  try {
    const { listId } = await request.json();
    const result = await removeListFromMap(mapId, listId);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error || 'Failed to remove list from map' }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`Error in DELETE /api/v1/maps/${mapId}/lists`, error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
