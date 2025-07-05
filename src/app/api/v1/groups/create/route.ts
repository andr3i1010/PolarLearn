import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth/auth";
import { prisma } from "@/utils/prisma";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const sessionId = (await cookies()).get("polarlearn.session-id")?.value as string;
    const user = await getUserFromSession(sessionId);

    if (!user?.id) {
      return NextResponse.json(
        { error: "Niet ingelogd" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, everyoneCanAddLists, isPublic } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Groepsnaam is verplicht" },
        { status: 400 }
      );
    }

    // Validate field types
    if (description && typeof description !== 'string') {
      return NextResponse.json(
        { error: "Beschrijving moet een tekst zijn" },
        { status: 400 }
      );
    }

    if (typeof everyoneCanAddLists !== 'boolean') {
      return NextResponse.json(
        { error: "everyoneCanAddLists moet een boolean zijn" },
        { status: 400 }
      );
    }

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: "isPublic moet een boolean zijn" },
        { status: 400 }
      );
    }

    // Trim and validate name length
    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: "Groepsnaam mag maximaal 100 karakters lang zijn" },
        { status: 400 }
      );
    }

    // Validate description length if provided
    if (description && description.length > 500) {
      return NextResponse.json(
        { error: "Beschrijving mag maximaal 500 karakters lang zijn" },
        { status: 400 }
      );
    }

    const groupId = uuidv4();

    // Create the group
    const group = await prisma.group.create({
      data: {
        groupId,
        name: trimmedName,
        description: description?.trim() || "",
        everyoneCanAddLists,
        requiresApproval: !isPublic,
        creator: user.id,
        members: [user.id], // Use array of user IDs
        admins: [user.id],  // Use array of user IDs
        listsAdded: []
      }
    });

    // Update the user's ownGroups and inGroups fields
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        ownGroups: true,
        inGroups: true
      }
    });

    if (userData) {
      const ownGroups = (userData.ownGroups as string[]) || [];
      const inGroups = (userData.inGroups as string[]) || [];

      await prisma.user.update({
        where: { id: user.id },
        data: {
          ownGroups: [...ownGroups, groupId],
          inGroups: [...inGroups, groupId]
        }
      });
    }

    return NextResponse.json({
      success: true,
      groupId: groupId
    });

  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Fout bij het aanmaken van de groep" },
      { status: 500 }
    );
  }
}
