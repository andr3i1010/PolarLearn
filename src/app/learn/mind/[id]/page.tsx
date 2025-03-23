import LearnTool from "@/components/learning/learnTool";
import { prisma } from "@/utils/prisma";
import Link from "next/link";

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
