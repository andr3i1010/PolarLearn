import LearnTool from "@/components/learning/learnTool";
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
            ? listdata.data.map(item => ({
                vraag: item["1"] || "",
                antwoord: item["2"] || ""
            }))
            : [];

    return (
        <div className="min-h-screen flex items-center justify-center flex-col">
            <Link
                href="/home/start"
                className="fixed top-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </Link>
            <LearnTool mode="gedachten" rawlistdata={rawListData} />
        </div>
    );
}