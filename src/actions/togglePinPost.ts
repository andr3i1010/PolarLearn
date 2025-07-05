"use server";

import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Types for the return value
type TogglePinResult =
    | { success: true; pinned: boolean }
    | { success: false; error: string };

export async function togglePinPost(postId: string): Promise<TogglePinResult> {
    try {
        // Get user from session
        const session = await getUserFromSession(
            (await cookies()).get("polarlearn.session-id")!.value
        );

        // Check if user is logged in
        if (!session || !session.id) {
            return {
                success: false,
                error: "Je moet ingelogd zijn om posts vast te pinnen.",
            };
        }

        // Check if user is an admin
        if (session.role !== "admin") {
            return {
                success: false,
                error: "Alleen admins kunnen posts pinnen.",
            };
        }

        // Fetch the current post to get its pinned status
        const post = await prisma.forum.findUnique({
            where: { post_id: postId },
            select: { pinned: true, type: true }
        });

        // Check if post exists
        if (!post) {
            return {
                success: false,
                error: "Post niet gevonden.",
            };
        }

        // Only allow pinning main posts, not replies
        if (post.type === "reply") {
            return {
                success: false,
                error: "Alleen hoofdposts kunnen worden vastgezet, geen antwoorden.",
            };
        }

        // Toggle the pinned status
        const updatedPost = await prisma.forum.update({
            where: { post_id: postId },
            data: { pinned: !post.pinned },
        });

        // Revalidate forum pages to show the updated pinned status
        revalidatePath('/home/forum');
        revalidatePath(`/home/forum/${postId}`);

        return {
            success: true,
            pinned: updatedPost.pinned,
        };
    } catch (error) {
        console.error("Error toggling pin status:", error);
        return {
            success: false,
            error: "Er is een fout opgetreden bij het wijzigen van de pin-status.",
        };
    }
}
