import LearnTool from "@/components/learning/learnTool"; // Keep LearnTool import if needed elsewhere, or remove if not
import { prisma } from "@/utils/prisma";
import Link from "next/link"; // Keep Link import if needed elsewhere, or remove if not
import { addToRecentLists } from "@/utils/actions/updateRecentLists";
import { addToRecentSubjects } from "@/utils/actions/updateRecentSubjects"; // Import action
import LearnToolWithProgress from "@/components/learning/LearnToolWithProgress"; // Import the component

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const listdata = await prisma.practice.findFirst({
        where: { list_id: id },
    });

    // Add this list to user's recent lists and subject
    if (listdata) {
        await addToRecentLists(id);
        if (listdata.subject) {
            await addToRecentSubjects(listdata.subject);
        }
    }

    const rawListData =
        listdata && listdata.data && Array.isArray(listdata.data)
            ? listdata.data.map((item: any) => ({
                vraag: item["1"] || "",
                antwoord: item["2"] || ""
            }))
            : [];

    // Replace the existing return statement with LearnToolWithProgress
    return (
        <LearnToolWithProgress
            mode="toets"
            rawlistdata={rawListData}
            listId={id}
            currentMethod="toets"
        />
    );
}