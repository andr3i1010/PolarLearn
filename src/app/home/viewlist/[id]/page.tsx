import { prisma } from "@/utils/prisma"
export default async function ViewListPage({ params }: { params: { id: string } }) {

    const listData = await prisma.practice.findFirst({
        where: {
            list_id: params.id
        },
        select: {
            list_id: true,
            name: true,
            createdAt: true,
            creator: true,
            data: true,
            lang_from: true,
            lang_to: true,
            published: true,
            updatedAt: true
        }
    })
    return (
        <div>
            <p>Name: {listData?.name}</p>   
            <p>List id: {listData?.list_id}</p>
            <p>Created at: {listData?.createdAt?.toLocaleString()}</p>
            <p>Creator: {listData?.creator}</p>
        </div>
    )
}