"use server";
import { prisma } from '@/utils/prisma';
import { cookies } from 'next/headers';
import { getUserFromSession } from '@/utils/auth/auth';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export async function createListAction(listData: {
	listId?: string;  // Optional listId for updates
	name: string;
	mode: string;
	data: any;
	lang_from: any;
	lang_to: any;
	subject: string;
	published?: boolean; // New field to control published state
	autosave?: boolean; // Flag to indicate if this is an autosave
}) {

	const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')!.value);
	if (!session?.name) {
		throw new Error("User not authenticated");
	}

	try {
		let result;
		const isAutosave = listData.autosave === true;

		// If listId is provided, update an existing list
		if (listData.listId) {
			// First, verify the user owns this list
			const existingList = await prisma.practice.findFirst({
				where: { list_id: listData.listId }
			});

			if (!existingList) {
				throw new Error("List not found");
			}

			if (existingList.creator !== session.name && existingList.creator !== session.id) {
				throw new Error("You don't have permission to edit this list");
			}

			// Don't change the published state during autosave unless explicitly set
			const publishedState = isAutosave
				? existingList.published
				: (listData.published !== undefined ? listData.published : existingList.published);

			// Update the existing list using its MongoDB ID
			result = await prisma.practice.update({
				where: { id: existingList.id }, // Use MongoDB's ObjectID
				data: {
					name: listData.name,
					mode: listData.mode,
					data: listData.data,
					lang_from: listData.lang_from,
					lang_to: listData.lang_to,
					subject: listData.subject,
					published: publishedState,
					updatedAt: new Date(),
				},
			});
		} else {
			// Create a new list
			// Default to unpublished for autosaves, otherwise use the provided value or default to true
			const publishedState = isAutosave ? false : (listData.published !== undefined ? listData.published : true);

			result = await prisma.practice.create({
				data: {
					list_id: uuidv4(),
					name: listData.name || "Naamloze Lijst",
					mode: listData.mode,
					data: listData.data,
					lang_from: listData.lang_from,
					lang_to: listData.lang_to,
					subject: listData.subject,
					creator: session.id,
					published: publishedState,
				},
			});

			// Only update the user data if this is not an autosave
			if (!isAutosave) {
				try {
					// Find the user directly by ID (more reliable than finding by email)
					const user = await prisma.user.findUnique({
						where: {
							id: session.id
						}
					});

					if (user && !user.loginAllowed) {
						redirect('/auth/sign-in');
					}

					if (!user) {
						const plainResult = JSON.parse(JSON.stringify(result));
						return plainResult; // Return the plain object
					}

					// Prepare the list_data to include the new list ID
					const currentListData = (user.list_data as any) || {};
					const updatedListData = {
						...currentListData,
						created_lists: [
							...(currentListData.created_lists || []),
							result.list_id
						]
					};

					// Update the user record
					await prisma.user.update({
						where: {
							id: user.id
						},
						data: {
							list_data: updatedListData
						}
					});
				} catch (error) {
					console.error("Error updating user list_data:", error);
					// Still return the list even if updating the user fails
				}
			}
		}

		// Return the result as a plain object to avoid Prisma serialization issues
		const plainResult = JSON.parse(JSON.stringify(result));
		return plainResult;
	} catch (error) {
		console.error("Error in createListAction:", error);
		throw error; // Re-throw to let the client handle it
	}
}
