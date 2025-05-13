"use server";

import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { formSchema } from "@/app/home/forum/formSchema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createReply(postId: string, content: string) {
  const session = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")!.value
  );

  if (!session || !session.id) {
    throw new Error("You must be logged in to reply");
  }

  let gebruiker = await prisma.user.findFirst({ where: { id: session.id } });
  if (!gebruiker || !gebruiker.loginAllowed || !gebruiker.forumAllowed) {
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
      votes_data: { users: {} },
    },
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
