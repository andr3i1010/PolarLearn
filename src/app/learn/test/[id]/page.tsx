import LearnTool from "@/components/learning/learnTool";
import { prisma } from "@/utils/prisma";

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    // Remove await—params is provided synchronously
    const { id } = await params;
    const listdata = await prisma.practice.findFirst({
        where: { list_id: id },
    });
    const rawListData =
        listdata && listdata.data
            ? (listdata.data as { vraag: string; antwoord: string }[])
            : [];

    return (
        <div className="min-h-screen flex items-center justify-center flex-col">
            <LearnTool mode="toets" rawlistdata={rawListData} />
        </div>
    );
}
