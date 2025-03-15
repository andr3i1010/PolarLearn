import { prisma } from "@/utils/prisma"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const listId = await params
    const listData = await prisma.practice.findFirst({
        where: {
            list_id: listId.id
        }
    })
    return (
        <div>
            <p>Name: {listData?.name}</p>
            <p>Subject: {listData?.subject}</p>
        </div>
    )
}