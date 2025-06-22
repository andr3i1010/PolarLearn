import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ subject: string }> }) {
    // This is the default route - redirect to the default tab
    const { subject } = await params;

    // Redirect to the default tab route
    redirect(`/learn/subject/${subject}/practiced-lists`);
}
