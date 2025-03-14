"use server";
import { prisma } from '@/utils/prisma';
import { auth } from '@/utils/auth';

export async function createListAction(listData: {
	name: string;
	mode: string;
	data: any;
	lang_from: any;
	lang_to: any;
	subject: string;
}) {
	const session = await auth();
	if (!session?.user.name) {
		throw new Error("User not authenticated");
	}
	const newList = await prisma.practice.create({
		data: {
			list_id: crypto.randomUUID(),
			name: listData.name,
			mode: listData.mode,
			data: listData.data,
			lang_from: listData.lang_from,
			lang_to: listData.lang_to,
			subject: listData.subject,
			creator: session.user.name,
			published: true,
		},
	});

	try {
		// Find the user by email (more reliable than name)
		const user = await prisma.user.findFirst({
			where: {
				email: session.user.email
			}
		});
		if (user && !user.loginAllowed) {
			return new Response("Je bent verbannen van PolarLearn", { status: 500 });
		}


		if (!user) {
			console.error("User not found for email:", session.user.email);
			return newList; // Still return the list even if we can't update the user
		}

		// Prepare the list_data to include the new list ID
		const currentListData = (user.list_data as any) || {};
		const updatedListData = {
			...currentListData,
			created_lists: [
				...(currentListData.created_lists || []),
				newList.list_id
			]
		};

		console.log("Updated list data:", updatedListData);

		// Update the user record
		await prisma.user.update({
			where: {
				id: user.id
			},
			data: {
				list_data: updatedListData
			}
		});

		console.log("Successfully updated user with new list");
	} catch (error) {
		console.error("Error updating user list_data:", error);
		// Still return the list even if updating the user fails
	}

	return newList;
}
