"use client"
import { useMemo, memo, useState, useEffect } from "react";
import Image from "next/image";
import NavBtn from "@/components/button/Button1";
import pl500 from "@/app/img/pl-500.png";
import DropdownBtn from "@/components/button/DropdownBtn";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MoveLeft, Search } from "lucide-react";
import Link from "next/link";

// SearchBar component
const SearchBar = memo(({ onExpand }: { onExpand: () => void }) => {
    const router = useRouter();

    const handleSearchClick = () => {
        onExpand();
        // Use setTimeout to allow the UI to update before navigation
        setTimeout(() => {
            router.push('/home/search');
        }, 100);
    };

    return (
        <div className="relative inline-block transition-transform rounded-4xl hover:bg-gradient-to-r from-sky-400 to-sky-100 hover:scale-101 scale-95 w-full"
            onClick={handleSearchClick}
        >
            <div className="rounded-4xl  border-4 border-neutral-700 duration-300 hover:border-transparent">
                <div className="bg-neutral-800 text-white font-bold py-2 px-4 transition-all rounded-4xl  duration-300 flex row">

                    <Search size={18} className="mr-2 text-neutral-400" />
                    <span className="text-neutral-400">Zoeken...</span>
                </div>
            </div>
        </div>
    );
});

const ExpandedSearchBar = memo(() => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentQuery = searchParams.get('q') || '';
    const [searchTerm, setSearchTerm] = useState(currentQuery);

    // Focus the input when it mounts
    const handleInputRef = (input: HTMLInputElement | null) => {
        if (input) {
            input.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const input = form.elements.namedItem('search') as HTMLInputElement;
        router.push(`/home/search?q=${encodeURIComponent(input.value)}`);
    };

    // Add debounce for automatic search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== currentQuery) {
                router.push(`/home/search?q=${encodeURIComponent(searchTerm)}`);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, router, currentQuery]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    return (
        <form onSubmit={handleSubmit} className="flex-grow w-full px-4 transition-all duration-200 ease-in-out flex-row flex items-center">
            <Link
                href="/home/start"
                className="mr-3 bg-neutral-700 w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-600 transition-colors duration-200 ease-in-out"
            >
                <MoveLeft />
            </Link>
            <div className="relative inline-block transition-transform hover:bg-gradient-to-r from-sky-400 to-sky-100 hover:scale-101 scale-95 w-full rounded-4xl "
            >
                <div className="rounded-4xl  border-4 border-neutral-700 duration-300 hover:border-transparent">
                    <div className="bg-neutral-800 text-white font-bold py-2 px-4 transition-all rounded-4xl  duration-300">
                        <input
                            ref={handleInputRef}
                            name="search"
                            type="text"
                            placeholder="Zoek lijsten en forum vragen..."
                            className="bg-neutral-800 text-white font-bold transition-all duration-300 w-full focus:outline-none"
                            autoComplete="off"
                            value={searchTerm}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
            </div>
        </form>
    );
});

const dropdownMatrixStart: [React.ReactNode, string][] = [
    ["Groepen", "/home/start"],
    ["Gemaakte lijsten", "/home/forum"],
    ["Vakken", "/learn/subjects"],
];

// Memoized navigation links component
const NavigationLinks = memo(({ pathname, onExpandSearch }: { pathname: string, onExpandSearch: () => void }) => (
    <>
        <NavBtn text="Start" redirectTo="/home/start" useClNav={true} />
        <NavBtn text="Forum" redirectTo="/home/forum" useClNav={true} />
        <div className="relative block mb-12" style={{ textAlign: "left" }}>
            <DropdownBtn selectorMode={false} text={"Leren"} dropdownMatrix={dropdownMatrixStart} />
        </div>
        <div className="w-36" />

        <div className=" flex-grow mx-4 max-w">
            <SearchBar onExpand={onExpandSearch} />
        </div>
        <div className="w-50" />
        <div className="ml-auto relative block dropdown-right">
            <DropdownBtn
                selectorMode={false}
                text={"Account"}
                dropdownMatrix={[
                    ["Accountinstellingen", "/home/settings"],
                    ["Uitloggen", "/auth/sign-out"]
                ]}
            />
        </div>
    </>
));

// Memoized login button component
const LoginButton = memo(() => (
    <div className="ml-auto flex items-center pr-4">
        <NavBtn text="Log in" redirectTo="/auth/sign-in" useClNav={false} />
    </div>
));

export const TopNavBar = memo(function TopNavBar() {
    const pathname = usePathname();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Use useMemo for display conditions to prevent recalculations on every render
    const displayConditions = useMemo(() => {
        const showOnViewList = pathname.startsWith('/learn/viewlist');
        const showOnSubjects = pathname.startsWith('/learn/subjects');
        const hideOnCreateList = pathname === "/home/createlist";
        const showOnHomeRoutes = pathname === "/" || pathname.startsWith("/home");
        const isSearchRoute = pathname.startsWith('/home/search');

        return {
            showOnViewList,
            showOnSubjects,
            hideOnCreateList,
            showOnHomeRoutes,
            shouldRender: showOnViewList || showOnSubjects || !(hideOnCreateList || !showOnHomeRoutes),
            showNavLinks: !isSearchExpanded && (pathname.startsWith("/home") || showOnViewList || showOnSubjects) && !isSearchRoute,
            showLoginButton: pathname === "/",
            isSearchRoute
        };
    }, [pathname, isSearchExpanded]);

    // Use router directly
    const router = useRouter();

    // Expand search and automatically navigate to search page
    const handleExpandSearch = () => {
        setIsSearchExpanded(true);
        // We'll use a short delay to allow the transition to happen before navigation
        setTimeout(() => {
            router.push('/home/search');
        }, 300);
    };

    // Reset search state when navigating away from search
    if (!displayConditions.isSearchRoute && isSearchExpanded) {
        setIsSearchExpanded(false);
    }

    if (!displayConditions.shouldRender) {
        return null;
    }

    return (
        <>
            <nav className="fixed top-0 min-w-full shadow-md start-0 max-w-screen-xl z-[100] flex flex-wrap justify-between h-16 bg-neutral-900/70 backdrop-blur-sm items-center fade-in font-[family-name:var(--font-geist-sans)] font-bold">
                <div className="flex items-center space-x-4 w-full transition-all duration-300 ease-in-out">
                    <a href="/">
                        <Image className="mx-2" src={pl500} alt="PolarLearn Logo" height={50} width={50} />
                    </a>

                    {isSearchExpanded || displayConditions.isSearchRoute ? (
                        <ExpandedSearchBar />
                    ) : (
                        <>
                            {displayConditions.showNavLinks && <NavigationLinks pathname={pathname} onExpandSearch={handleExpandSearch} />}
                            {displayConditions.showLoginButton && <LoginButton />}
                        </>
                    )}
                </div>
            </nav>
            <div className="h-16" />
            <style jsx global>{`
                .dropdown-right > div.absolute {
                    right: 6px !important;
                    top: -24px !important;
                }
                
                /* Add transition styles for smooth animations */
                .fade-in {
                    transition: opacity 0.3s ease-in-out;
                }
                
                .search-expanded {
                    max-width: 100%;
                }
            `}</style>
        </>
    );
});