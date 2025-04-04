import ViewUserPage from '../page';
import { unstable_noStore as noStore } from 'next/cache';

export default async function ViewUserRoute({
    params,
}: {
    params: Promise<{ name: string; tab: string[] }>;
}) {
    noStore(); // Disable caching

    // We need to await the params since it's a Promise in Next.js route handlers
    const { name, tab } = await params;
    const selectedTab = tab?.[0] || 'lists'; // Default to 'lists' if no tab is provided

    // Return the page component with the extracted parameters
    return <ViewUserPage params={Promise.resolve({ name, selectedTab })} />;
}
