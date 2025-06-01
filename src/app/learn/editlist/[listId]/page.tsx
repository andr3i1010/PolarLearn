import { prisma } from "@/utils/prisma";
import CreateListTool from "@/components/learning/createList";
import { notFound } from "next/navigation";
import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Define JsonValue type to handle JSON data
type JsonValue =
    | string
    | number
    | boolean
    | null
    | { [key: string]: JsonValue }
    | JsonValue[];

// Helper type for the list data conversion
type Pair = {
    id: number;
    "1": string;
    "2": string;
};

// Helper function to check if something is a plain object with string keys
const isObject = (value: any): value is { [key: string]: JsonValue } => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export default async function EditListPage({
    params,
}: {
    params: Promise<{ listId: string }>;
}) {
    const { listId } = await params;

    // Get the current user to check permissions
    const currentUser = await getUserFromSession((await cookies()).get('polarlearn.session-id')?.value as string);

    // Use findFirst instead of findUnique since list_id might not be marked as @unique
    const listFromDb = await prisma.practice.findFirst({
        where: { list_id: listId },
    });

    // If no list found, show 404
    if (!listFromDb) {
        return notFound();
    }

    // Check if the current user is the creator of the list or an admin
    // Check both name and id to handle both legacy username-based and new ID-based creator fields
    const isCreator = (listFromDb.creator === currentUser?.name || listFromDb.creator === currentUser?.id);
    const isAdmin = currentUser?.role === "admin";

    if (!isCreator && !isAdmin) {
        // Redirect to view page if user doesn't have permission to edit
        redirect(`/learn/viewlist/${listId}`);
    }

    // Convert the list data to the expected format
    const formattedData = Array.isArray(listFromDb.data)
        ? listFromDb.data.map((item: any, index: number) => {
            // Initialize with default empty values
            const pair: Pair = { id: index, "1": '', "2": '' };

            // Only extract values if item is an object with the expected properties
            if (isObject(item)) {
                // After isObject check, item is known to be {[key: string]: JsonValue}
                const value1 = item["1"];
                if (typeof value1 === 'string') {
                    pair["1"] = value1;
                }
                const value2 = item["2"];
                if (typeof value2 === 'string') {
                    pair["2"] = value2;
                }
            }

            return pair;
        })
        : [{ id: 0, "1": '', "2": '' }];

    // Create a properly typed version of the list
    const list = {
        list_id: listFromDb.list_id,
        name: listFromDb.name,
        subject: listFromDb.subject,
        data: formattedData,
        lang_from: listFromDb.lang_from || '',
        lang_to: listFromDb.lang_to || '',
        mode: listFromDb.mode
    };

    return (
        <div className="mx-2">
            <div className="text-center">
                <h1 className="text-4xl pt-4 font-extrabold">Lijst Bewerken</h1>
            </div>
            <CreateListTool listToEdit={list} />
        </div>
    );
}
