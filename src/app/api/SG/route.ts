import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { auth } from '@/utils/auth';

export async function GET(request: NextRequest) {
    let antwoord = { returnData: {}, title: "" };
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
        antwoord = await getList(id) || { returnData: {}, title: "" };
    }

    const session = await auth();
    if (!session?.user?.name || !session?.user?.email) {
        throw new Error("User not authenticated");
    }

    // Zorg dat `listData` correct wordt ingevuld
    const listData = {
        name: antwoord.title,
        mode: "default",
        data: antwoord.returnData,
    };

    const newList = await prisma.practice.create({
        data: {
            list_id: crypto.randomUUID(),
            name: listData.name,
            mode: listData.mode,
            data: listData.data,
            lang_from: "onbekend",
            lang_to: "onbekend",
            subject: "onbekend",
            creator: session.user.name,
            published: true,
        },
    });

    try {
        const user = await prisma.user.findFirst({
            where: { email: session.user.email },
        });

        if (!user) {
            console.error("User not found for email:", session.user.email);
            return newList;
        }

        const currentListData = (user.list_data as any) || {};
        const updatedListData = {
            ...currentListData,
            created_lists: [...(currentListData.created_lists || []), newList.list_id],
        };

        await prisma.user.update({
            where: { id: user.id },
            data: { list_data: updatedListData },
        });

        console.log("Successfully updated user with new list");
    } catch (error) {
        console.error("Error updating user list_data:", error);
    }

    return NextResponse.json(newList);
}

async function getList(id: string): Promise<{ returnData: { question: string; answer: string; id: any; }[]; title: string } | undefined> {
    try {
        const response = await fetch(`https://api.wrts.nl/api/v3/public/lists/${id}`);

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.title || !data.words_with_performance) {
            return undefined;
        }

        const returnData = data.words_with_performance.map((entry: { words: string[]; }) => ({
            question: entry.words[0] || "",
            answer: entry.words[1] || "",
            id: entry.words[2] || "",
        }));

        return { returnData, title: data.title };
    } catch (error) {
        console.error('Error fetching data:', error);
        return undefined;
    }
}
