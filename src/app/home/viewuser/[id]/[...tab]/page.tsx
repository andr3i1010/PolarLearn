import ViewUserPage from '../page';

export default async function ViewUserRoute({
    params,
}: {
    params: Promise<{ id: string; tab: string[] }>;
}) {

    // We need to await the params since it's a Promise in Next.js route handlers
    const { id, tab } = await params;
    const selectedTab = tab?.[0] || 'lists'; // Default to 'lists' if no tab is provided

    // Return the page component with the extracted parameters
    return <ViewUserPage params={Promise.resolve({ id, selectedTab })} />;
}
