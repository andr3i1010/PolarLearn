import { prisma } from "@/utils/prisma"
import { NextPage, GetServerSideProps } from 'next';

interface PageParams {
  params: {
    id: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}

const ViewListPage: NextPage<any, PageParams> = async ({ params }: PageParams) => {
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

export default ViewListPage;