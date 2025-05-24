import construction from '@/app/img/construction.gif';
import Button1 from '@/components/button/Button1';
import Image from 'next/image';
// import LearnToolHeader from "@/components/navbar/learntToolHeader";
// import { prisma } from "@/utils/prisma";
// import { addToRecentLists } from "@/utils/actions/updateRecentLists";
// import { addToRecentSubjects } from "@/utils/actions/updateRecentSubjects";
// import LearnToolWithProgress from "@/components/learning/LearnToolWithProgress"; // Import the component

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    // const { id } = await params;

    // // Add this list to user's recent lists
    // const listdata = await prisma.practice.findFirst({
    //     where: { list_id: id },
    // });

    // if (listdata) {
    //     await addToRecentLists(id);

    //     // Also add the subject to recent subjects
    //     if (listdata.subject) {
    //         await addToRecentSubjects(listdata.subject);
    //     }
    // }

    // // Transform the data correctly
    // const rawListData =
    //     listdata && listdata.data && Array.isArray(listdata.data)
    //         ? listdata.data.map((item: any) => ({
    //             vraag: item["1"] || "",
    //             antwoord: item["2"] || ""
    //         }))
    //         : [];
    return (
        <div className='flex justify-center items-center h-screen flex-col'>
            <Image src={construction} alt="Under construction" />
            <br />
            <Button1 text='Terug naar home' redirectTo='/home/start' />
        </div>
    )
}