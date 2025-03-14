"use server"

import { prisma } from "@/utils/prisma"
import { auth } from "@/utils/auth"
import { redirect } from "next/navigation"
import { v4 as uuidv4 } from 'uuid'

export async function createReply(postId: string, content: string) {
  const session = await auth()

  if (!session || !session.user || !session.user.name) {
    throw new Error("You must be logged in to reply")
  }

  let gebruiker = prisma.user.findUnique({ where: { name: session.user.name } })
  if (!gebruiker.loginAllowed || !gebruiker.forumAllowed) {
    throw new Error("je bent verbannen van de PolarLearn forums")
  }

  // Get the original post to copy the subject
  const originalPost = await prisma.forum.findUnique({
    where: {
      post_id: postId
    }
  })

  if (!originalPost) {
    throw new Error("Original post not found")
  }

  // Create the reply
  const reply = await prisma.forum.create({
    data: {
      post_id: uuidv4(),
      type: "reply",
      replyTo: postId,
      title: `Re: ${originalPost.title}`,
      subject: originalPost.subject,
      content: content,
      creator: session.user.name,
      votes: 0,
      votes_data: { users: {} }
    }
  })

  return reply
}

export async function deletePost(postId: string) {
  const session = await auth()

  if (!session || !session.user || !session.user.name) {
    throw new Error("You must be logged in to delete a post")
  }

  // Get the post to ensure the current user is the creator
  const post = await prisma.forum.findUnique({
    where: {
      post_id: postId
    }
  })

  if (!post) {
    throw new Error("Post not found")
  }

  // More flexible creator check
  const isCreator = post.creator === session.user.name || post.creator === session.user.id;

  if (!isCreator) {
    // Try to find the user by ID to see if they match
    const user = await prisma.user.findUnique({
      where: { id: post.creator },
      select: { name: true }
    });

    if (user?.name !== session.user.name) {
      throw new Error("You can only delete your own posts");
    }
  }

  // If it's a main post, also delete all replies
  if (post.type !== "reply") {
    await prisma.forum.deleteMany({
      where: {
        replyTo: postId
      }
    })
  }

  // Delete the post itself
  await prisma.forum.delete({
    where: {
      post_id: postId
    }
  })

  // If it was a main post, redirect to forum list
  // If it was a reply, we'll just refresh the page
  if (post.type !== "reply") {
    return { redirect: "/home/forum" }
  }

  return { success: true }
}
