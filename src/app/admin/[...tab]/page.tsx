import AdminPage from '../page';

export default async function ViewUserRoute({
    params,
    searchParams,
}: {
    params: { tab: string[] };
    searchParams: { page?: string };
}) {

    const selectedTab = params.tab?.[0] || 'gebruikers'; // Default to 'gebruikers' if no tab is provided
    const page = searchParams.page || '1'; // Get page from searchParams

    console.log('Tab:', selectedTab, 'Page:', page);

    // Return the AdminPage component with the extracted parameters
    return <AdminPage
        params={{ tab: [selectedTab] }}
        searchParams={{ page }}
    />;
}
