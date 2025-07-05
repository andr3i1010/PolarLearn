import SearchTabsWrapper from "./SearchTabsWrapper";

export default function SearchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="pt-4">
            <SearchTabsWrapper />
            <div className="mt-4">
                {children}
            </div>
        </div>
    );
}
