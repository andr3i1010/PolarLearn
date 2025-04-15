import LearnTool from "@/components/learning/learnTool"; // Keep LearnTool import if needed elsewhere, or remove if not
import LearnToolHeader from "@/components/navbar/learntToolHeader"; // Keep LearnToolHeader import if needed elsewhere, or remove if not
import { prisma } from "@/utils/prisma";
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

    // Transform the data correctly - the database has format { "1": string, "2": string }
    // but LearnTool expects { vraag: string, antwoord: string }
    const rawListData =
        listdata && listdata.data && Array.isArray(listdata.data)
            ? listdata.data.map((item: any) => {
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                    return {
                        vraag: item["1"] || "",
                        antwoord: item["2"] || ""
                    };
                }
                return { vraag: "", antwoord: "" };
            })
            : [];

    // Replace the existing return statement with LearnToolWithProgress
    return (
        <LearnToolWithProgress
            mode="gedachten"
            rawlistdata={rawListData}
            listId={id}
            currentMethod="gedachten"
        />
    );
}