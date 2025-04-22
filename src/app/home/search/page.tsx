
import SearchResultsComponent from './SearchResultsComponent';

// Use 'any' to bypass strict type checking for props
export default function SearchPage({ searchParams }: any) {
    // Render the actual results component
    return (
        <div className="pt-4">
            {/* Pass the full searchParams object. params is undefined here */}
            <SearchResultsComponent searchParams={searchParams} params={undefined} />
        </div>
    );
}
