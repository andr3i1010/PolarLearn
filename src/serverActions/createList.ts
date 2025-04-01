"use server";
import { prisma } from '@/utils/prisma';
import { cookies } from 'next/headers';
import { getUserFromSession } from '@/utils/auth/auth';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export async function createListAction(listData: {
	name: string;
	mode: string;
	data: any;
	lang_from: any;
	lang_to: any;
	subject: string;
}) {
	const session = await getUserFromSession((await cookies()).get('polarlearn.session-id')!.value);
	if (!session?.name) {
		throw new Error("User not authenticated");
	}
	const newList = await prisma.practice.create({
		data: {
			list_id: uuidv4(),
			name: listData.name,
			mode: listData.mode,
			data: listData.data,
			lang_from: listData.lang_from,
			lang_to: listData.lang_to,
			subject: listData.subject,
			creator: session.name,
			published: true,
		},
	});

	// Convert Prisma result to a plain object
	const plainNewList = JSON.parse(JSON.stringify(newList));

	try {
		// Find the user by email (more reliable than name)
		const user = await prisma.user.findFirst({
			where: {
				email: session.email
			}
		});
		if (user && !user.loginAllowed) {
			redirect('/auth/sign-in');
		}


		if (!user) {
			return plainNewList; // Return the plain object
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

	return plainNewList;
}
