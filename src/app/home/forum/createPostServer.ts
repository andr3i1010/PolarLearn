"use server";
import { z } from "zod";
import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// Define the form schema for validation
const formSchema = z.object({
  title: z
    .string()
    .min(1, "Titel is verplicht")
    .max(100, "Titel mag maximaal 100 tekens bevatten"),
  content: z
    .string()
    .min(1, "Postinhoud is verplicht")
    .max(5000, "Inhoud mag maximaal 5000 tekens bevatten"),
  category: z.string().min(1, "Selecteer een categorie"),
  subject: z.string(),
}).refine(
  (data) => {
    // Only require subject selection when category is school
    if (data.category !== "school") {
      return true;
    }

    // For school category, subject is required
    return data.subject.length > 0;
  },
  {
    message: "Selecteer een vak",
    path: ["subject"], // Path tells Zod which field caused the error
  }
);

// Define the return type for better TypeScript support
type CreatePostResult =
  | { success: true; postId: string }
  | { success: false; error: string };

// Export a function to get the form schema
async function getFormSchema() {
  return formSchema;
}

export async function createPostServer(
  formData: z.infer<typeof formSchema>
): Promise<CreatePostResult> {
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
        error: "Je moet ingelogd zijn om een post te maken.",
      };
    }

    // Check if user is allowed to use the announcement category
    if (validatedData.category === "announcement" && user.role !== "admin") {
      return {
        success: false,
        error: "Je hebt geen toestemming om aankondigingen te maken.",
      };
    }

    // Generate a unique post ID
    const postId = crypto.randomUUID();

    // Ensure we have a valid string key for the votes_data object
    const userName = user.name as string;

    // Create the post in the database
    const post = await prisma.forum.create({
      data: {
        post_id: postId,
        type: "thread",
        title: validatedData.title as string,
        content: validatedData.content as string,
        subject: validatedData.subject as string,
        category: validatedData.category as string,
        creator: user.id,
        votes: 1, // Start with 1 upvote (self-upvote)
        votes_data: { users: { [userName]: "up" } }, // Add creator's upvote
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Revalidate the forum page to show the new post
    revalidatePath("/home/forum");

    return {
      success: true,
      postId: post.post_id,
    };
  } catch (error) {
    console.error("Error creating forum post:", error);

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
      error: "Er is een fout opgetreden bij het maken van je post.",
    };
  }
}
