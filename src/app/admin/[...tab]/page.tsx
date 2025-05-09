import AdminPage from '../page';
// ik haat typescript
// ik haat typescript
// ik haat typescript
// ik haat typescript
// uuren verspilt aan typescript: 1

// same bro
export default async function ViewUserRoute({
    params,
    searchParams,
}: {
    params: Promise<{ tab: string[] }>;
    searchParams: Promise<{ page?: string }>;
}) {
    try {
        const params2 = await params;
        const selectedTab = await params2.tab?.[0] || 'gebruikers'; // Default to 'gebruikers' if no tab is provided
        const resolvedSearchParams = await searchParams;
        const page = resolvedSearchParams.page || '1'; // Get page from searchParams

        // Return the AdminPage component with the extracted parameters
        return <AdminPage
            params={Promise.resolve({ tab: [selectedTab] })}
            searchParams={Promise.resolve({ page })}
        />;
    } catch (error) {
        // als iets fout gaat ga dan naar geruikers
        return <AdminPage
            params={Promise.resolve({ tab: ['gebruikers'] })}
            searchParams={Promise.resolve({ page: '1' })}
        />;
    }
}
