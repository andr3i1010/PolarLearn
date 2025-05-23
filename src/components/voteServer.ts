"use server"

import { prisma } from "@/utils/prisma"
import { getUserFromSession } from "@/utils/auth/auth"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

type VoteDirection = "up" | "down" | null

export default async function VoteServer(postId: string, direction: VoteDirection) {
  try {
    const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')!.value)

    if (!session) {
      throw new Error("Unauthorized")
    }
    const user = session.name

    if (!user) {
      throw new Error("User ID not found in session")
    }

    const post = await prisma.forum.findUnique({
      where: {
        post_id: postId,
      },
    })

    if (!post) {
      throw new Error("Post not found")
    }

    // Parse votes_data or initialize as empty object
    const votesData: { users: Record<string, VoteDirection> } = post.votes_data
      ? (typeof post.votes_data === 'string' ? JSON.parse(post.votes_data) : post.votes_data)
      : { users: {} };

    // Initialize users object if not exists
    if (!votesData.users) {
      votesData.users = {};
    }

    // Get current vote (if any)
    const currentVote = votesData.users[user];

    // Calculate vote change
    let voteChange = 0;

    // Copy the userVotes object to manipulate it
    const updatedUserVotes: Record<string, VoteDirection> = { ...votesData.users };

    if (currentVote === direction) {
      // Cancel vote if clicking the same button
      voteChange = currentVote === "up" ? -1 : 1;
      delete updatedUserVotes[user]; // Remove the user's vote
    }
    else if (direction === null) {
      // Remove vote
      voteChange = currentVote === "up" ? -1 : currentVote === "down" ? 1 : 0;
      delete updatedUserVotes[user];
    }
    else {
      // New vote or change vote
      if (!currentVote) {
        voteChange = direction === "up" ? 1 : -1;
      } else {
        voteChange = direction === "up" ? 2 : -2;
      }
      updatedUserVotes[user] = direction; // Set the user's vote
    }

    // Update the votes_data with modified user votes
    votesData.users = updatedUserVotes;

    // Update the post
    const updatedPost = await prisma.forum.update({
      where: {
        post_id: postId,
      },
      data: {
        votes: {
          increment: voteChange
        },
        votes_data: votesData
      },
    });

    // Award or remove points for the post creator based on upvotes
    // Only do this if it's not the creator voting on their own post
    if (post.creator !== user && (direction === "up" || currentVote === "up")) {
      try {
        // Find the user (post creator) to update their points
        const creator = await prisma.user.findFirst({
          where: {
            OR: [
              { id: post.creator },
              { name: post.creator }
            ]
          },
          select: {
            id: true,
            name: true,
            forumPoints: true
          }
        });

        if (creator) {
          let pointsDelta = 0;

          // Calculate points change
          if (direction === "up" && currentVote !== "up") {
            // New upvote or changed from downvote to upvote: +1 point
            pointsDelta = 1;
          } else if (direction !== "up" && currentVote === "up") {
            // Removed upvote or changed from upvote to downvote: -1 point
            pointsDelta = -1;
          }

          if (pointsDelta !== 0) {
            // Check if forumPoints is null or undefined
            if (creator.forumPoints === null || creator.forumPoints === undefined) {
              // Initialize with the correct value
              await prisma.user.update({
                where: {
                  id: creator.id
                },
                data: {
                  forumPoints: pointsDelta // Start with the delta (1 or -1)
                }
              });
              console.log(`Initialized forumPoints for user ${creator.id} with value ${pointsDelta}`);
            } else {
              // Normal case: increment existing points
              await prisma.user.update({
                where: {
                  id: creator.id
                },
                data: {
                  forumPoints: {
                    increment: pointsDelta
                  }
                }
              });
            }
          }
        }
      } catch (error) {
        console.error("Error updating forum points:", error);
        // Don't fail the whole operation if points update fails
      }
    }

    revalidatePath(`/home/forum/${postId}`);

    return {
      success: true,
      votes: updatedPost.votes,
      userVote: direction
    };
  } catch (error) {
    console.error("Vote error:", error);
    return { success: false, error: String(error) };
  }
}