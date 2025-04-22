import AdminPage from '../page';
import { unstable_noStore as noStore } from 'next/cache';

export default async function ViewUserRoute({
    params,
}: {
    params: Promise<{ page: string; tab: string[] }>;
}) {
    noStore(); // Disable caching

    // We need to await the params since it's a Promise in Next.js route handlers
    const { page, tab } = await params;
    const selectedTab = tab?.[0] || 'gebruikers'; // Default to 'lists' if no tab is provided

    // Return the page component with the extracted parameters
    console.log(page)
    return <AdminPage params={{ tab: [selectedTab] }} />;
}
