import LearnTool from "@/components/learning/learnTool";
import LearnToolHeader from "@/components/navbar/learntToolHeader";
import { prisma } from "@/utils/prisma";
import Link from "next/link";
import { addToRecentLists } from "@/utils/actions/updateRecentLists";

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

    // Transform the data correctly - the database has format { "1": string, "2": string }
    // but LearnTool expects { vraag: string, antwoord: string }
    const rawListData =
        listdata && listdata.data && Array.isArray(listdata.data)
            ? listdata.data.map((item: any) => ({
                vraag: item["1"] || "",
                antwoord: item["2"] || ""
            }))
            : [];

    return (
        <div className="min-h-screen flex flex-col">
            <LearnToolHeader listId={id} currentMethod="multikeuze" />

            <div className="flex-grow flex items-center justify-center">
                <LearnTool mode="multikeuze" rawlistdata={rawListData} />
            </div>
        </div>
    );
}
