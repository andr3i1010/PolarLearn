import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { z } from "zod";

// Define the form schema for validation
const editPostSchema = z.object({
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
    path: ["subject"],
  }
);

const editReplySchema = z.object({
  content: z
    .string()
    .min(1, "Reactie-inhoud is verplicht")
    .max(5000, "Inhoud mag maximaal 5000 tekens bevatten"),
});

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');
    const body = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is verplicht" },
        { status: 400 }
      );
    }

    // Get the current user
    const user = await getUserFromSession();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om te bewerken" },
        { status: 401 }
      );
    }

    // Check if the post exists
    const existingPost = await prisma.forum.findUnique({
      where: { post_id: postId },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post niet gevonden" },
        { status: 404 }
      );
    }

    // Check if the user has permission to edit this post
    if (existingPost.creator !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Je kunt alleen je eigen posts bewerken" },
        { status: 403 }
      );
    }

    // Determine if this is a post or reply and validate accordingly
    if (existingPost.type === "reply") {
      // This is a reply - only validate content
      const validatedData = editReplySchema.parse(body);

      await prisma.forum.update({
        where: { post_id: postId },
        data: {
          content: validatedData.content,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    } else {
      // This is a main post - validate all fields
      const validatedData = editPostSchema.parse(body);

      // Update the post in the database
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

      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error updating forum post:", error);

    // Return appropriate error message based on error type
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => e.message).join(", ");
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bewerken" },
      { status: 500 }
    );
  }
}
