import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { z } from "zod";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = formSchema.parse(body);
    if (validatedData.content.includes("studygo")) {
      validatedData.content = validatedData.content.replace(/studygo/g, "st*dygo 🤢");
    }

    // Get the current user
    const user = await getUserFromSession();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om een post te maken." },
        { status: 401 }
      );
    }

    // Check if user is banned
    if (!user.loginAllowed || !user.forumAllowed) {
      return NextResponse.json(
        { error: "Je bent verbannen van het forum." },
        { status: 403 }
      );
    }

    // Check if user is allowed to use the announcement category
    if (validatedData.category === "announcement" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Je hebt geen toestemming om aankondigingen te maken." },
        { status: 403 }
      );
    }

    // Generate a unique post ID
    const postId = crypto.randomUUID();

    // Ensure we have a valid string key for the votes_data object
    const userName = user.name as string;
  
    await prisma.forum.create({
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

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    // Calculate new points value - either start at 10 or add 10 to current value
    const newPointsValue = currentUser?.forumPoints === null || currentUser?.forumPoints === undefined
      ? 10
      : Number(currentUser.forumPoints) + 10;

    // Directly set the value instead of using increment to bypass null handling issues
    await prisma.user.update({
      where: { id: user.id },
      data: { forumPoints: newPointsValue }
    });

    return NextResponse.json(
      { success: true, postId: postId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating forum post:", error);

    // Return appropriate error message based on error type
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => e.message).join(", ");
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het maken van je post." },
      { status: 500 }
    );
  }
}
