import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is verplicht" },
        { status: 400 }
      );
    }

    // Get the current user
    const session = await getUserFromSession();

    if (!session || !session.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om te verwijderen" },
        { status: 401 }
      );
    }

    // Get the post to ensure the current user is the creator
    const post = await prisma.forum.findUnique({
      where: {
        post_id: postId,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post niet gevonden" },
        { status: 404 }
      );
    }

    // Check if the user has permission to delete this post
    if (post.creator !== session.id && session.role !== "admin") {
      return NextResponse.json(
        { error: "Je kunt alleen je eigen posts verwijderen" },
        { status: 403 }
      );
    }

    // Handle forum points deduction for the post creator (if not admin deleting someone else's post)
    if (post.creator === session.id) {
      try {
        // Find the user and update their forum points
        const user = await prisma.user.findUnique({
          where: { id: session.id }
        });

        if (user && user.forumPoints !== null && user.forumPoints !== undefined) {
          // Deduct 10 points but don't go below 0
          const newPoints = Math.max(0, Number(user.forumPoints) - 10);

          await prisma.user.update({
            where: {
              id: user.id
            },
            data: {
              forumPoints: newPoints
            }
          });
        }
      } catch (error) {
        console.error("Error updating forum points for post deletion:", error);
        // Continue with deletion even if point update fails
      }
    }

    // If it's a main post, also delete all replies
    if (post.type !== "reply") {
      await prisma.forum.deleteMany({
        where: {
          replyTo: postId,
        },
      });
    }

    // Delete the post itself
    await prisma.forum.delete({
      where: {
        post_id: postId,
      },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verwijderen" },
      { status: 500 }
    );
  }
}
