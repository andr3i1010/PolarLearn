"use server";

import { prisma } from "@/utils/prisma";
import { getUserFromSession } from "@/utils/auth/auth";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
// import { revalidatePath } from "next/cache";

export interface SummaryData {
    id?: string; // This will be the list_id (UUID) if present when saving/updating
    name: string;
    subjectId: string;
    content: string;
    autosave?: boolean; // Flag to indicate if this is an autosave
}

export async function saveSummary(
    data: SummaryData
): Promise<{ id?: string | null; error?: string; lastSaved?: Date; message?: string }> {
    const user = await getUserFromSession();
    if (!user || !user.id) {
        return { error: "Gebruiker niet geverifieerd." };
    }

    const { id: listIdFromInput, subjectId, content, name, autosave } = data; // id from input is list_id (UUID)
    const isAutosave = autosave === true;

    if (!subjectId) {
        return { error: "Vak is vereist." };
    }
    if (!name) {
        return { error: "Naam is vereist." };
    }

    try {
        let savedSummary;
        const timestamp = new Date();

        if (listIdFromInput) {
            // Update existing summary
            const summaryToUpdate = await prisma.practice.findFirst({
                where: { list_id: listIdFromInput, creator: user.id, mode: "summary" },
                select: { id: true, published: true } // Select the MongoDB _id and published state
            });

            if (!summaryToUpdate) {
                // If not found, it means the provided listIdFromInput is stale, incorrect, or a placeholder.
                // We should create a new summary with a new, valid UUID.
                console.warn(`Summary with list_id '${listIdFromInput}' not found. Creating a new summary with a new UUID instead.`);
                const newGeneratedUUID = randomUUID(); // Generate a fresh UUID
                savedSummary = await prisma.practice.create({
                    data: {
                        creator: user.id,
                        subject: subjectId,
                        summaryContent: content,
                        name: name,
                        list_id: newGeneratedUUID, // Use the new UUID
                        mode: "summary",
                        published: false, // New summaries are drafts
                        createdAt: timestamp,
                        updatedAt: timestamp,
                    },
                });
                // Return the newly generated UUID
                return { id: savedSummary.list_id, lastSaved: savedSummary.createdAt, message: "Samenvatting aangemaakt (opgegeven ID was niet gevonden/geldig)." };
            }

            // Determine published state for update
            // - If autosaving, keep current published state.
            // - If manual saving an already published summary, keep it published.
            // - If manual saving an unpublished summary (draft), keep it unpublished.
            const publishedState = isAutosave ? summaryToUpdate.published : summaryToUpdate.published;
            // For manual save, if you want it to always become a draft, set: 
            // const publishedState = isAutosave ? summaryToUpdate.published : false;

            savedSummary = await prisma.practice.update({
                where: { id: summaryToUpdate.id }, // Update by MongoDB _id
                data: {
                    subject: subjectId,
                    summaryContent: content,
                    updatedAt: timestamp,
                    name: name,
                    published: publishedState, // Set published state
                },
            });
            // Note: User metadata (like recent_summaries) is NOT updated on autosave, which is correct.
            return { id: savedSummary.list_id, lastSaved: savedSummary.updatedAt, message: "Samenvatting bijgewerkt." };
        } else {
            // Create new summary
            const newPracticeListId = randomUUID();
            savedSummary = await prisma.practice.create({
                data: {
                    creator: user.id,
                    subject: subjectId,
                    summaryContent: content,
                    name: name,
                    list_id: newPracticeListId,
                    mode: "summary",
                    published: false, // New summaries are drafts
                    createdAt: timestamp,
                    updatedAt: timestamp,
                },
            });
            // Note: User metadata (like recent_summaries) is NOT updated on autosave, which is correct.
            return { id: savedSummary.list_id, lastSaved: savedSummary.createdAt, message: "Samenvatting aangemaakt." };
        }
    } catch (error: any) {
        console.error("Error saving summary:", error);
        // Specific P2025 error handling might be less relevant if findFirst is used before update,
        // but kept for robustness or if direct updates are re-introduced.
        if (error.code === 'P2025' && listIdFromInput) {
            // This block might be redundant now due to the findFirst check above, 
            // but can serve as a last resort if the record disappears between check and update.
            try {
                const newPracticeIdForFallback = listIdFromInput || randomUUID(); // Reuse ID if possible
                const newSummary = await prisma.practice.create({
                    data: {
                        creator: user.id,
                        subject: subjectId,
                        summaryContent: content,
                        name: name || "Nieuwe samenvatting (herstel)",
                        list_id: newPracticeIdForFallback,
                        mode: "summary",
                        published: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
                return { id: newSummary.list_id, lastSaved: newSummary.createdAt, message: "Nieuwe samenvatting aangemaakt na kritieke updatefout." };
            } catch (createError: any) {
                console.error("Error creating summary after P2025 error:", createError);
                return { error: "Kon samenvatting niet opslaan na kritieke updatefout." };
            }
        }
        return { error: `Kon samenvatting niet opslaan: ${error.message || "Onbekende fout"}` };
    }
}

export async function getSummaryById(list_id: string): Promise<{
    id: string | null; // This will be the list_id (UUID)
    subject: string;
    summaryContent: string | null;
    name: string;
    lastSaved: Date;
    published: boolean; // Added published state
} | { error: string }> {
    const user = await getUserFromSession();
    if (!user || !user.id) {
        return { error: "Gebruiker niet geverifieerd." };
    }
    if (!list_id) {
        return { error: "Samenvatting ID (UUID) is vereist." };
    }

    try {
        const summary = await prisma.practice.findFirst({
            where: {
                list_id: list_id, // Query by list_id (UUID)
                creator: user.id, // Ensure user owns the summary
                mode: "summary",
            },
            select: {
                list_id: true,
                subject: true,
                summaryContent: true,
                name: true,
                updatedAt: true,
                published: true, // Select published state
            },
        });

        if (!summary) {
            return { error: "Samenvatting niet gevonden of geen toegang." };
        }

        return {
            id: summary.list_id, // Return list_id (UUID) as id
            subject: summary.subject,
            summaryContent: summary.summaryContent,
            name: summary.name,
            lastSaved: summary.updatedAt,
            published: summary.published, // Return published state
        };
    } catch (error: any) {
        console.error("Error fetching summary:", error);
        return { error: `Kon samenvatting niet ophalen: ${error.message || "Onbekende fout"}` };
    }
}

export async function getAllSummaries(): Promise<Array<{ id: string | null; name: string; subject: string; updatedAt: Date; mode: string; creator: string | null; published: boolean; }> | { error: string }> {
    try {
        const user = await getUserFromSession(
            (await cookies()).get("polarlearn.session-id")?.value as string
        );
        if (!user || !user.id) {
            return { error: "Gebruiker niet geverifieerd." };
        }

        // Get user's list data to find recent summaries
        const account = await prisma.user.findUnique({
            where: { id: user.id },
        });

        const listData = (account?.list_data as any) || {};

        // Get recently practiced lists - this array contains the IDs in order of recency
        const recentListIds = Array.isArray(listData.recent_lists)
            ? listData.recent_lists.filter(Boolean)
            : [];

        // Get user-created lists
        const createdListIds = Array.isArray(listData.created_lists)
            ? listData.created_lists.filter(Boolean)
            : [];

        // Create combined list of IDs to fetch
        const combinedListIds = [...recentListIds, ...createdListIds].filter(Boolean);

        const summaries = await prisma.practice.findMany({
            where: {
                mode: "summary",
                AND: [
                    {
                        OR: [
                            // Include summaries from combined list IDs (recent + created)
                            ...(combinedListIds.length > 0
                                ? [{ list_id: { in: combinedListIds } }]
                                : []),
                            // Include summaries created by user (by name or ID)
                            { creator: user.id },
                            ...(user.name ? [{ creator: user.name }] : []),
                        ],
                    }
                ]
            },
            orderBy: {
                updatedAt: 'desc',
            },
            select: {
                list_id: true, // Still select list_id from DB
                name: true,
                subject: true,
                updatedAt: true,
                mode: true,
                creator: true,
                published: true, // Add published field
            }
        });

        // Create a map for quick lookup of the summary's position in recentListIds
        interface RecentListPositions {
            [listId: string]: number;
        }

        const recentListIdPositions: RecentListPositions = Object.fromEntries(
            recentListIds.map((id: string, index: number) => [id, index])
        );

        // Sort summaries to prioritize recently viewed ones
        const sortedSummaries = summaries.sort((a, b) => {
            // First, check if both summaries are in recentListIds
            const aInRecent = a.list_id && a.list_id in recentListIdPositions;
            const bInRecent = b.list_id && b.list_id in recentListIdPositions;

            if (aInRecent && bInRecent) {
                // Both summaries are recently viewed, compare their positions in recentListIds
                return (
                    recentListIdPositions[a.list_id!] - recentListIdPositions[b.list_id!]
                );
            } else if (aInRecent) {
                // Only a is recently viewed, so a comes first
                return -1;
            } else if (bInRecent) {
                // Only b is recently viewed, so b comes first
                return 1;
            } else {
                // Neither is recently viewed, fallback to updatedAt timestamp
                return (
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
            }
        });

        // Map list_id to id for consistency with how start/page.tsx expects it
        return sortedSummaries.filter(s => s.list_id !== null).map(s => ({ ...s, id: s.list_id }));
    } catch (error: any) {
        console.error("Error fetching all summaries:", error);
        return { error: `Kon samenvattingen niet ophalen: ${error.message || "Onbekende fout"}` };
    }
}

export async function deleteSummary(list_id: string): Promise<{ success?: boolean; error?: string; message?: string }> {
    const user = await getUserFromSession();
    if (!user || !user.id) {
        return { error: "Gebruiker niet geverifieerd." };
    }

    if (!list_id) {
        return { error: "Samenvatting ID (UUID) is vereist." };
    }

    try {
        const summaryToDelete = await prisma.practice.findFirst({
            where: {
                list_id: list_id, // Find by list_id (UUID)
                creator: user.id,
                mode: "summary",
            },
            select: {
                id: true, // Select the MongoDB _id
            },
        });

        if (!summaryToDelete) {
            return { error: "Samenvatting niet gevonden, geen toegang, of het is geen samenvatting." };
        }

        await prisma.practice.delete({
            where: {
                id: summaryToDelete.id, // Delete by MongoDB _id
            },
        });
        return { success: true, message: "Samenvatting succesvol verwijderd." };
    } catch (error: any) {
        console.error("Error deleting summary:", error);
        return { error: `Kon samenvatting niet verwijderen: ${error.message || "Onbekende fout"}` };
    }
}

export interface PublishSummaryData {
    id: string; // This will be the list_id (UUID)
}

export async function publishSummary(
    data: PublishSummaryData
): Promise<{ id?: string | null; error?: string; lastSaved?: Date; message?: string }> {
    const user = await getUserFromSession();
    if (!user || !user.id) {
        return { error: "Gebruiker niet geverifieerd." };
    }

    const { id: listIdFromInput } = data;

    if (!listIdFromInput) {
        return { error: "Samenvatting ID (UUID) is vereist om te publiceren." };
    }

    try {
        const summaryToPublish = await prisma.practice.findFirst({
            where: { list_id: listIdFromInput, creator: user.id, mode: "summary" },
            select: { id: true } // Select the MongoDB _id for update
        });

        if (!summaryToPublish) {
            return { error: "Samenvatting niet gevonden of je hebt geen toegang om te publiceren." };
        }

        const updatedSummary = await prisma.practice.update({
            where: { id: summaryToPublish.id }, // Update by MongoDB _id
            data: {
                published: true,
                updatedAt: new Date(),
            },
        });

        // Update user's recent_lists and created_lists if it's the first time publishing
        // This logic is similar to createListAction
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: { list_data: true }
        });

        if (userData) {
            const currentListData = (userData.list_data as any) || {};
            const isAlreadyInCreated = (currentListData.created_lists || []).includes(updatedSummary.list_id);

            let updatedRecentLists = [...(currentListData.recent_lists || [])];
            if (!updatedRecentLists.includes(updatedSummary.list_id)) {
                updatedRecentLists = [updatedSummary.list_id, ...updatedRecentLists].slice(0, 10);
            }

            let updatedCreatedLists = [...(currentListData.created_lists || [])];
            if (!isAlreadyInCreated) {
                updatedCreatedLists = [...updatedCreatedLists, updatedSummary.list_id];
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    list_data: {
                        ...currentListData,
                        created_lists: updatedCreatedLists,
                        recent_lists: updatedRecentLists
                    }
                }
            });
        }

        return { id: updatedSummary.list_id, lastSaved: updatedSummary.updatedAt, message: "Samenvatting succesvol gepubliceerd!" };

    } catch (error: any) {
        console.error("Error publishing summary:", error);
        return { error: `Kon samenvatting niet publiceren: ${error.message || "Onbekende fout"}` };
    }
}
