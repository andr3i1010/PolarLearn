"use server"

import { prisma } from "@/utils/prisma"
import { auth } from "@/utils/auth"
import { revalidatePath } from "next/cache"

type VoteDirection = "up" | "down" | null

export default async function VoteServer(postId: string, direction: VoteDirection) {
  try {
    const session = await auth()

    if (!session?.user) {
      throw new Error("Unauthorized")
    }
    const user = session.user.name

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