import GroupPage from '../page';

export default async function GroupTabRoute({
    params,
}: {
    params: Promise<{ id: string; tab: string }>;
}) {

    // We need to await the params since it's a Promise in Next.js route handlers
    const { id, tab } = await params;

    // Return the main page component with the parameters passed through
    return <GroupPage params={Promise.resolve({ id, tab })} />;
}
