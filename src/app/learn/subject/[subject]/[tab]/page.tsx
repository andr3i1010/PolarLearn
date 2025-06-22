import SubjectTabPage from '../[...tab]/page';

export default async function TabPage({ params }: { params: Promise<{ subject: string; tab: string }> }) {
    // Transform the single tab param to match the [...tab] pattern
    const { subject, tab } = await params;
    const tabParams = { subject, tab: [tab] };

    return <SubjectTabPage params={Promise.resolve(tabParams)} />;
}
