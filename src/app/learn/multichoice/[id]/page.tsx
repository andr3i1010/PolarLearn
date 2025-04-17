import { prisma } from "@/utils/prisma";
import { addToRecentLists } from "@/utils/actions/updateRecentLists";
import { addToRecentSubjects } from "@/utils/actions/updateRecentSubjects";
import LearnToolWithProgress from "@/components/learning/LearnToolWithProgress";

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const listdata = await prisma.practice.findFirst({
        where: { list_id: id },
    });

    // Add this list to user's recent lists
    await addToRecentLists(id);

    // Also add the subject to recent subjects
    if (listdata?.subject) {
        await addToRecentSubjects(listdata.subject);
    }

    // Transform the data correctly without splitting commas
    // Simply map from the database format to the format expected by LearnToolWithProgress
    const rawListData =
        listdata && listdata.data && Array.isArray(listdata.data)
            ? listdata.data.map((item: any) => ({
                vraag: item["1"] || "",
                antwoord: item["2"] || ""
            }))
            : [];

    return (
        <LearnToolWithProgress
            mode="multikeuze"
            rawlistdata={rawListData}
            listId={id}
            currentMethod="multikeuze"
        />
    );
}
