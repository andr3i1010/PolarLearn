"use server"

import { prisma } from "@/utils/prisma"
import { getUserFromSession } from "@/utils/auth/auth"
import { v4 as uuidv4 } from 'uuid'
import { cookies } from "next/headers"

export async function createReply(postId: string, content: string) {
  const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')!.value)

  if (!session || !session.id) {
    throw new Error("You must be logged in to reply")
  }

  let gebruiker = await prisma.user.findFirst({ where: { id: session.id } })
  if (!gebruiker || !gebruiker.loginAllowed || !gebruiker.forumAllowed) {
    throw new Error("je bent verbannen van PolarLearn")
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
      creator: session.id,
      votes: 0,
      votes_data: { users: {} }
    }
  })

  return reply
}

export async function deletePost(postId: string) {
  const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')!.value)

  if (!session || !session.id) { // Check for session.id
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

  // Check if the session user ID matches the post creator ID or admin
  if (post.creator !== session.id) {

    // As a fallback, check if the creator field might store the username (legacy)
    // and if it matches the session username. This can be removed later
    // once all creator fields are confirmed to be IDs.
    if (post.creator !== session.name) {
      if (session?.role !== "admin") {
        throw new Error("You can only delete your own posts");
      }
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
