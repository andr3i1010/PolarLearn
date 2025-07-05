import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { v4 as uuidv4 } from "uuid";
import { sendNotificationToUser } from "@/utils/notifications/sendNotification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, content, userId } = body;

    if (!postId || !content) {
      return NextResponse.json(
        { error: "Post ID en inhoud zijn verplicht" },
        { status: 400 }
      );
    }

    // Get the current user
    const session = await getUserFromSession();

    if (!session || !session.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om te reageren" },
        { status: 401 }
      );
    }

    // Check if user is banned
    let gebruiker = await prisma.user.findFirst({ where: { id: session.id } });
    if (!gebruiker || !gebruiker.loginAllowed || !gebruiker.forumAllowed) {
      return NextResponse.json(
        { error: "Je bent verbannen van het forum" },
        { status: 403 }
      );
    }

    // Get the original post to copy the subject
    const originalPost = await prisma.forum.findUnique({
      where: {
        post_id: postId,
      },
    });

    if (!originalPost) {
      return NextResponse.json(
        { error: "Originele post niet gevonden" },
        { status: 404 }
      );
    }

    // Create the reply with auto self-upvote
    const replyId = uuidv4();

    // Ensure we have a valid string key for the votes_data object
    const userName = session.name as string;

    const reply = await prisma.forum.create({
      data: {
        post_id: replyId,
        type: "reply",
        replyTo: postId,
        title: `Re: ${originalPost.title}`,
        subject: originalPost.subject,
        content: content,
        creator: session.id,
        votes: 1, // Start with 1 upvote (self-upvote)
        votes_data: { users: { [userName]: "up" } }, // Add creator's upvote
      },
    });

    // Only send notification if the person replying is not the original poster
    if (userId !== session.id && userId !== session.name) {
      await sendNotificationToUser(userId, session.name + " heeft op je vraag '" + originalPost.title + "' geantwoord!");
    }

    // A more direct approach that bypasses the null issue
    // First, fetch the current user with all their data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id }
    });

    // Calculate new points value - either start at 10 or add 10 to current value
    const newPointsValue = currentUser?.forumPoints === null || currentUser?.forumPoints === undefined
      ? 10
      : Number(currentUser.forumPoints) + 10;

    // Directly set the value instead of using increment to bypass null handling issues
    await prisma.user.update({
      where: { id: session.id },
      data: { forumPoints: newPointsValue }
    });

    return NextResponse.json(
      { success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating reply:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het maken van je reactie" },
      { status: 500 }
    );
  }
}
