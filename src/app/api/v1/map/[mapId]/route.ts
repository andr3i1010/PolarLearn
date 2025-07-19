import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserFromSession } from '@/utils/auth/auth';
import { prisma } from '@/utils/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;

    // Get current user
    const sessionId = (await cookies()).get('polarlearn.session-id')?.value;
    const user = await getUserFromSession(sessionId as string);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the map
    const map = await prisma.map.findUnique({
      where: { id: mapId }
    });

    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    }

    // Check if user is the creator
    if (map.creator !== user.name) {
      return NextResponse.json({ error: 'Only the map creator can delete the map' }, { status: 403 });
    }

    // Delete the map (no need to delete related records since lists are just referenced in the lists array)
    await prisma.map.delete({
      where: { id: mapId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting map:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
