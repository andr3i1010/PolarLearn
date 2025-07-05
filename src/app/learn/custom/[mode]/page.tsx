import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CustomLearnClient from "@/components/learning/CustomLearnClient";

// Define valid learning modes
type LearningMode = "toets" | "gedachten" | "hints" | "learn" | "multikeuze" | "leren";

// Map route parameters to learning modes
const modeMapping: Record<string, { mode: LearningMode; currentMethod: string }> = {
    "test": { mode: "toets", currentMethod: "toets" },
    "learn": { mode: "learn", currentMethod: "learn" },
    "hints": { mode: "hints", currentMethod: "hints" },
    "mind": { mode: "gedachten", currentMethod: "gedachten" },
    "multichoice": { mode: "multikeuze", currentMethod: "multikeuze" },
    "leren": { mode: "leren", currentMethod: "leren" },
};

export default async function CustomLearnPage({
    params,
}: {
    params: Promise<{ mode: string }>;
}) {
    const { mode: modeParam } = await params;
    const cookieStore = await cookies();

    // Check if the mode is valid
    const modeConfig = modeMapping[modeParam];
    if (!modeConfig) {
        redirect('/home/start');
    }

    // Get selected pairs from cookies
    const selectedPairsValue = cookieStore.get('selectedPairs')?.value;
    const fromLanguage = cookieStore.get('fromLanguage')?.value;
    const toLanguage = cookieStore.get('toLanguage')?.value;
    const listId = cookieStore.get('listId')?.value;

    // If no selected pairs, redirect to home start
    if (!selectedPairsValue || !listId) {
        redirect('/home/start');
    }

    let selectedPairs: number[] = [];
    try {
        selectedPairs = JSON.parse(selectedPairsValue);
    } catch (error) {
        console.error('Error parsing selected pairs:', error);
        redirect('/home/start');
    }

    // Get the full list data to filter selected pairs
    const { prisma } = await import("@/utils/prisma");
    const listData = await prisma.practice.findFirst({
        where: { list_id: listId },
        select: {
            data: true,
            name: true,
            subject: true,
            lang_from: true,
            lang_to: true,
        }
    });

    if (!listData || !listData.data || !Array.isArray(listData.data)) {
        redirect('/learn');
    }

    // Add this list to user's recent lists (same as other learn tools)
    const { addToRecentLists } = await import("@/utils/actions/updateRecentLists");
    const { addToRecentSubjects } = await import("@/utils/actions/updateRecentSubjects");

    await addToRecentLists(listId);

    // Also add the subject to recent subjects
    if (listData.subject) {
        await addToRecentSubjects(listData.subject);
    }

    // Filter the data to only include selected pairs
    const selectedWordPairs = listData.data.filter((item: any) =>
        selectedPairs.includes(item.id)
    );

    // Transform to the format expected by LearnToolWithProgress
    const rawListData = selectedWordPairs.map((item: any) => ({
        vraag: item["1"] || "",
        antwoord: item["2"] || ""
    }));

    // If no valid selected pairs, redirect to home start
    if (rawListData.length === 0) {
        redirect('/home/start');
    }

    return (
        <CustomLearnClient
            mode={modeConfig.mode}
            rawlistdata={rawListData}
            listId={`custom-${listId}`}
            currentMethod={modeConfig.currentMethod}
        />
    );
}
