import SubjectPage from '../page';

export default function TabPage({ params }: { params: Promise<{ subject: string; tab: string }> }) {
    // Pass params to the main page component
    return <SubjectPage params={Promise.resolve(params)} />;
}
