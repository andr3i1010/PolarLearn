"use server";

import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { formSchema } from "@/app/home/forum/formSchema";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendNotificationToUser } from "@/utils/notifications/sendNotification"



export async function createReply(postId: string, content: string, userId: string) {
  const session = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")!.value
  );

  if (!session || !session.id) {
    throw new Error("You must be logged in to reply");
  }

  let gebruiker = await prisma.user.findFirst({ where: { id: session.id } });
  if (!gebruiker || gebruiker.loginAllowed === false || !gebruiker.forumAllowed) {
    throw new Error("je bent verbannen van PolarLearn");
  }

  // Get the original post to copy the subject
  const originalPost = await prisma.forum.findUnique({
    where: {
      post_id: postId,
    },
  });

  if (!originalPost) {
    throw new Error("Original post not found");
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
    await sendNotificationToUser(userId, session.name + " heeft op je vraag '" + originalPost.title + "' geantwoord!")
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

  return reply;
}

export async function deletePost(postId: string) {
  const session = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")!.value
  );

  if (!session || !session.id) {
    // Check for session.id
    throw new Error("You must be logged in to delete a post");
  }

  // Get the post to ensure the current user is the creator
  const post = await prisma.forum.findUnique({
    where: {
      post_id: postId,
    },
  });

  if (!post) {
    throw new Error("Post not found");
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

  // If user is deleting their own post (not an admin deleting someone else's post)
  const isUserDeletingOwnPost = post.creator === session.id || post.creator === session.name;

  // If user is deleting their own post, subtract 10 forum points
  if (isUserDeletingOwnPost) {
    try {
      // Find the user to update their points
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: session.id },
            { name: session.name }
          ]
        },
        select: {
          id: true,
          forumPoints: true
        }
      });

      if (user) {
        // Check if forumPoints is null or undefined
        if (user.forumPoints === null || user.forumPoints === undefined) {
          // Initialize with -10
          await prisma.user.update({
            where: {
              id: user.id
            },
            data: {
              forumPoints: -10
            }
          });
        } else {
          // Subtract 10 points from existing points
          await prisma.user.update({
            where: {
              id: user.id
            },
            data: {
              forumPoints: {
                decrement: 10
              }
            }
          });
        }
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

  // Revalidate the forum pages to ensure proper refresh
  revalidatePath("/home/forum");
  if (post.replyTo) {
    // If it was a reply, also revalidate the parent post page
    revalidatePath(`/home/forum/${post.replyTo}`);
  } else {
    // If it was a main post, revalidate its specific page too
    revalidatePath(`/home/forum/${postId}`);
  }

  // If it was a main post, redirect to forum list
  // If it was a reply, we'll just refresh the page
  if (post.type !== "reply") {
    return { redirect: "/home/forum" };
  }

  return { success: true };
}

// Add a function to fetch a post by ID
export async function getPost(postId: string) {
  try {
    const post = await prisma.forum.findUnique({
      where: {
        post_id: postId,
      },
    });

    return post;
  } catch (error) {
    console.error("Error fetching post:", error);
    throw error;
  }
}

// Define the return type for better TypeScript support
type UpdatePostResult =
  | { success: true; postId: string }
  | { success: false; error: string };

export async function updatePost(
  postId: string,
  formData: z.infer<typeof formSchema>
): Promise<UpdatePostResult> {
  try {
    // Validate the form data
    const validatedData = formSchema.parse(formData);

    // Get the current user
    const user = await getUserFromSession(
      (await cookies()).get("polarlearn.session-id")?.value as string
    );

    if (!user || !user.id) {
      return {
        success: false,
        error: "Je moet ingelogd zijn om een post te bewerken.",
      };
    }

    // Check if user is allowed to use the announcement category
    if (validatedData.category === "announcement" && user.role !== "admin") {
      return {
        success: false,
        error: "Je hebt geen toestemming om aankondigingen te maken.",
      };
    }

    // Fetch the post to ensure the user is the creator
    const existingPost = await prisma.forum.findUnique({
      where: { post_id: postId },
    });

    if (!existingPost) {
      return {
        success: false,
        error: "Post niet gevonden.",
      };
    }

    if (existingPost.creator !== user.id && user.role !== "admin") {
      return {
        success: false,
        error: "Je kunt alleen je eigen posts bewerken.",
      };
    }

    // Update the post in the database
    // If the category is not 'school', always clear the subject
    const updateData: any = {
      title: validatedData.title,
      content: validatedData.content,
      category: validatedData.category,
      updatedAt: new Date(),
    };
    if (validatedData.category === 'school') {
      updateData.subject = validatedData.subject;
    } else {
      updateData.subject = '';
    }
    await prisma.forum.update({
      where: { post_id: postId },
      data: updateData,
    });

    // Revalidate the post page to show the updated content
    revalidatePath(`/home/forum/${postId}`);

    return {
      success: true,
      postId: postId,
    };
  } catch (error) {
    console.error("Error updating forum post:", error);

    // Return appropriate error message based on error type
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => e.message).join(", ");
      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: false,
      error: "Er is een fout opgetreden bij het bewerken van je post.",
    };
  }
}

// Define the return type for reply updates
type UpdateReplyResult =
  | { success: true; postId: string }
  | { success: false; error: string };

export async function updateReply(
  postId: string,
  content: string
): Promise<UpdateReplyResult> {
  try {
    // Validate the content
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: "Reactie-inhoud is verplicht.",
      };
    }

    if (content.length > 5000) {
      return {
        success: false,
        error: "Inhoud mag maximaal 5000 tekens bevatten.",
      };
    }

    // Get the current user
    const user = await getUserFromSession(
      (await cookies()).get("polarlearn.session-id")?.value as string
    );

    if (!user || !user.id) {
      return {
        success: false,
        error: "Je moet ingelogd zijn om een reactie te bewerken.",
      };
    }

    // Fetch the reply to ensure the user is the creator
    const existingReply = await prisma.forum.findUnique({
      where: { post_id: postId },
    });

    if (!existingReply) {
      return {
        success: false,
        error: "Reactie niet gevonden.",
      };
    }

    // Check if it's actually a reply
    if (existingReply.type !== "reply") {
      return {
        success: false,
        error: "Dit is geen reactie maar een hoofdpost.",
      };
    }

    // Check if the user has permission to edit this reply
    if (existingReply.creator !== user.id && user.role !== "admin") {
      return {
        success: false,
        error: "Je kunt alleen je eigen reacties bewerken.",
      };
    }

    // Update the reply in the database
    await prisma.forum.update({
      where: { post_id: postId },
      data: {
        content: content,
        updatedAt: new Date(),
      },
    });

    // If we have the parent post ID, revalidate its page to show the updated content
    if (existingReply.replyTo) {
      revalidatePath(`/home/forum/${existingReply.replyTo}`);
    }

    return {
      success: true,
      postId: postId,
    };
  } catch (error) {
    console.error("Error updating forum reply:", error);

    return {
      success: false,
      error: "Er is een fout opgetreden bij het bewerken van je reactie.",
    };
  }
}

/**
 * Server action to check if the current user is an admin
 * @returns {Promise<boolean>} True if user is an admin, false otherwise
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    // Use the custom auth system instead of NextAuth
    const cookieStore = cookies();
    const sessionCookie = (await cookieStore).get("polarlearn.session-id");

    if (!sessionCookie?.value) {
      return false;
    }

    const session = await getUserFromSession(sessionCookie.value);

    // Check if user is authenticated and has admin role (using lowercase "admin" based on other code)
    if (session?.role === "admin") {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
