"use server";
import { prisma } from '@/utils/prisma';
import { auth } from '@/utils/auth';

export async function createListAction(listData: {
	name: string;
	mode: string;
	data: any;
	lang_from: any;
	lang_to: any;
}) {
	const session = await auth();
	return await prisma.practice.create({
		data: {
			list_id: crypto.randomUUID(),
			name: listData.name,
			mode: listData.mode,
			data: listData.data,
			lang_from: listData.lang_from,
			lang_to: listData.lang_to,
			creator: session?.user.name as string,
			published: true,
		},
	});
}
