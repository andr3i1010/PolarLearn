import SearchResultsComponent from '../SearchResultsComponent';

// Use 'any' to bypass strict type checking for props
export default function SearchTabRoute({ params, searchParams }: any) {
    // Render the actual results component
    return (
        <div className="pt-4">
            {/* Pass the full objects as props */}
            <SearchResultsComponent params={params} searchParams={searchParams} />
        </div>
    );
}

