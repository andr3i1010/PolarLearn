"use server"
import { z } from "zod";
import { prisma } from "@/utils/prisma";
import { userInfo } from "@/utils/datatool";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// Define the form schema for validation
const formSchema = z.object({
    title: z.string().min(1, "Titel is verplicht").max(100, "Titel mag maximaal 100 tekens bevatten"),
    content: z.string().min(1, "Postinhoud is verplicht").max(5000, "Inhoud mag maximaal 5000 tekens bevatten"),
    subject: z.string().min(1, "Selecteer een vak"),
});

// Define the return type for better TypeScript support
type CreatePostResult =
    | { success: true; postId: string }
    | { success: false; error: string };

// Export a function to get the form schema
export async function getFormSchema() {
    return formSchema;
}

export async function createPostServer(formData: z.infer<typeof formSchema>): Promise<CreatePostResult> {
    try {
        // Validate the form data
        const validatedData = formSchema.parse(formData);

        // Get the current user
        const user = await userInfo();
        if (!user || !user.id) {
            return {
                success: false,
                error: "Je moet ingelogd zijn om een post te maken."
            };
        }
        if (!user.forumAllowed || !user.loginAllowed) {

            return {
                success: false,
                error: "helaas ben je verbannen van PolarLearn forums."
            };
        }
        // Create the post in the database
        const post = await prisma.forum.create({
            data: {
                post_id: crypto.randomUUID(),
                type: "thread",
                title: validatedData.title as string,
                content: validatedData.content as string,
                subject: validatedData.subject as string,
                creator: user.id as string,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        // Revalidate the forum page to show the new post
        revalidatePath("/home/forum");

        return {
            success: true,
            postId: post.id
        };
    } catch (error) {
        console.error("Error creating forum post:", error);

        // Return appropriate error message based on error type
        if (error instanceof z.ZodError) {
            const errorMessage = error.errors.map(e => e.message).join(", ");
            return {
                success: false,
                error: errorMessage
            };
        }

        return {
            success: false,
            error: "Er is een fout opgetreden bij het maken van je post."
        };
    }
}