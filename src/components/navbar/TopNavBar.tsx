"use client"
import { useMemo, memo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import NavBtn from "@/components/button/Button1";
import pl500 from "@/app/img/pl-500.svg";
import DropdownBtn from "@/components/button/DropdownBtn";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MoveLeft, Search, Menu, X } from "lucide-react";
import Link from "next/link";
import StreakNavbarThing from "../streak/streakNav";
import NotificationNav from "../notification/notificiationNav";

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
        <div
            className="relative inline-block transition-transform rounded-4xl hover:bg-gradient-to-r from-sky-400 to-sky-100 hover:scale-101 scale-95"
            onClick={handleSearchClick}
        >
            <div className="rounded-4xl border-4 border-neutral-700 duration-300 hover:border-transparent">
                <div className="bg-neutral-800 text-white font-bold py-2 px-4 transition-all rounded-4xl duration-300 flex flex-row items-center">
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
        <form
            onSubmit={handleSubmit}
            className="flex-grow w-full px-4 transition-all duration-200 ease-in-out flex-row flex items-center"
        >
            <Link
                href="/home/start"
                className="mr-3 bg-neutral-700 w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-600 transition-colors duration-200 ease-in-out"
            >
                <MoveLeft />
            </Link>
            <div
                className="relative inline-block transition-transform hover:bg-gradient-to-r from-sky-400 to-sky-100 hover:scale-101 scale-95 w-full rounded-4xl"
            >
                <div className="rounded-4xl border-4 border-neutral-700 duration-300 hover:border-transparent">
                    <div className="bg-neutral-800 text-white font-bold py-2 px-4 transition-all rounded-4xl duration-300">
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
    ["Groepen", "/learn/groups"],
    ["Gemaakte lijsten", "/home/forum"],
    ["Vakken", "/learn/subjects"],
];

// Mobile dropdown component
const MobileDropdown = memo(
    ({
        text,
        dropdownMatrix,
        isOpen,
        onToggle,
    }: {
        text: string;
        dropdownMatrix: [React.ReactNode, string][];
        isOpen: boolean;
        onToggle: () => void;
    }) => {
        const dropdownRef = useRef<HTMLDivElement>(null);
        const [dropdownHeight, setDropdownHeight] = useState<number>(0);

        useEffect(() => {
            if (dropdownRef.current) {
                setDropdownHeight(dropdownRef.current.scrollHeight);
            }
        }, [isOpen]);

        return (
            <div className={`inline-block hover:bg-gradient-to-r from-sky-400 to-sky-100 transition-transform rounded-lg w-full mb-3`}>
                <div
                    className={`rounded-lg border-4 border-neutral-700 duration-300 ${isOpen ? 'hover:border-transparent' : ''}`}
                    style={{
                        height: isOpen ? `${48 + dropdownHeight}px` : "48px",
                        backgroundColor: isOpen ? "transparent" : "#262626",
                    }}
                >
                    <button
                        type="button"
                        className="w-full bg-neutral-800 text-white font-bold py-2 px-4 rounded-t-md flex justify-between items-center"
                        onClick={onToggle}
                    >
                        <span>{text}</span>
                        <span className="transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>

                    <div
                        ref={dropdownRef}
                        className={`overflow-hidden transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0"
                            } shadow-lg`}
                        style={{
                            height: isOpen ? `${dropdownHeight}px` : "0px",
                            backgroundColor: "#262626",
                            margin: "0 auto",
                            transition: "height 0.3s ease, opacity 0.3s ease",
                        }}
                    >
                        {dropdownMatrix.map(([display, path], index) => (
                            <Link
                                key={index}
                                href={path as string}
                                className="block px-4 py-2 text-white hover:bg-sky-500 transition-colors duration-200"
                            >
                                {display}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
);

// Mobile menu component
const MobileMenu = memo(
    ({
        isOpen,
        onClose,
        pathname,
        onExpandSearch,
    }: {
        isOpen: boolean;
        onClose: () => void;
        pathname: string;
        onExpandSearch: () => void;
    }) => {
        const [lerenOpen, setLerenOpen] = useState(false);
        const [accountOpen, setAccountOpen] = useState(false);

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-neutral-900 z-[90] p-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <Link href="/">
                        <Image src={pl500} alt="PolarLearn Logo" height={50} width={50} />
                    </Link>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-neutral-800"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-4">
                    <SearchBar onExpand={() => {
                        onExpandSearch();
                        onClose();
                    }} />
                </div>

                <div className="flex flex-col space-y-4">
                    <Link
                        href="/home/start"
                        className={`inline-block hover:bg-gradient-to-r from-sky-400 to-sky-100 transition-transform rounded-lg w-full mb-3`}
                    >
                        <div className="rounded-lg border-4 border-neutral-700 duration-300 hover:border-transparent">
                            <div className={`bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg `}>
                                Start
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/home/forum"
                        className={`inline-block hover:bg-gradient-to-r from-sky-400 to-sky-100 transition-transform rounded-lg w-full mb-3`}
                    >
                        <div className="rounded-lg border-4 border-neutral-700 duration-300 hover:border-transparent">
                            <div className={`bg-neutral-800 text-white font-bold py-2 px-4 rounded-lg `}>

                                Forum
                            </div>
                        </div>
                    </Link>

                    <MobileDropdown
                        text="Leren"
                        dropdownMatrix={dropdownMatrixStart}
                        isOpen={lerenOpen}
                        onToggle={() => setLerenOpen(!lerenOpen)}
                    />

                    <MobileDropdown
                        text="Account"
                        dropdownMatrix={[
                            ["Accountinstellingen", "/home/settings"],
                            ["Uitloggen", "/auth/sign-out"],
                        ]}
                        isOpen={accountOpen}
                        onToggle={() => setAccountOpen(!accountOpen)}
                    />
                </div>
            </div>
        );
    }
);

// Memoized navigation links component
const NavigationLinks = memo(
    ({
        pathname,
        onExpandSearch,
    }: {
        pathname: string;
        onExpandSearch: () => void;
    }) => (
        <>
            <div className="hidden md:flex items-center space-x-4 flex-grow">
                <NavBtn text="Start" redirectTo="/home/start" useClNav={true} />
                <NavBtn text="Forum" redirectTo="/home/forum" useClNav={true} />
                <div className="relative block mb-12" style={{ textAlign: "left" }}>
                    <DropdownBtn
                        selectorMode={false}
                        text={"Leren"}
                        dropdownMatrix={dropdownMatrixStart}
                    />
                </div>
                <div className="w-36" />

                <div className="flex-grow mx-4 max-w pr-5">
                    <SearchBar onExpand={onExpandSearch} />
                </div>
                <StreakNavbarThing />
                <NotificationNav/>
                <div className="w-50" />
                <div className="ml-auto relative block dropdown-right">
                    <DropdownBtn
                        selectorMode={false}
                        text={"Account"}
                        dropdownMatrix={[
                            ["Accountinstellingen", "/home/settings"],
                            ["Uitloggen", "/auth/sign-out"],
                        ]}
                    />
                </div>
            </div>
        </>
    )
);

// Memoized login button component
const LoginButton = memo(() => (
    <div className="ml-auto flex items-center pr-4">
        <NavBtn text="Log in" redirectTo="/auth/sign-in" useClNav={false} />
    </div>
));

export const TopNavBar = memo(function TopNavBar() {
    const pathname = usePathname();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Use useMemo for display conditions to prevent recalculations on every render
    const displayConditions = useMemo(() => {
        const showOnViewList = pathname.startsWith('/learn/viewlist');
        const showOnSubjects = pathname.startsWith('/learn/subject') || pathname === "/learn/subjects";
        const hideOnCreateList = pathname === "/home/createlist";
        const showOnHomeRoutes = pathname === "/" || pathname.startsWith("/home");
        const isSearchRoute = pathname.startsWith('/home/search');

        const showOnGroups =
            pathname === "/learn/groups" || pathname.startsWith("/learn/group/");
        return {
            showOnViewList,
            showOnSubjects,
            showOnGroups,
            hideOnCreateList,
            showOnHomeRoutes,
            shouldRender:
                showOnViewList ||
                showOnSubjects ||
                showOnGroups ||
                !(hideOnCreateList || !showOnHomeRoutes),
            showNavLinks:
                !isSearchExpanded &&
                (pathname.startsWith("/home") ||
                    showOnViewList ||
                    showOnSubjects ||
                    showOnGroups) &&
                !isSearchRoute,
            showLoginButton: pathname === "/",
            isSearchRoute,
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

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Close mobile menu when window is resized to desktop size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!displayConditions.shouldRender) {
        return null;
    }

    return (
        <>
            <nav className="fixed top-0 min-w-full shadow-md start-0 max-w-screen-xl z-[50] flex flex-wrap justify-between h-16 bg-neutral-900/70 backdrop-blur-sm items-center fade-in font-[family-name:var(--font-geist-sans)] font-bold">
                <div className="flex items-center space-x-4 w-full transition-all duration-300 ease-in-out px-2">
                    <a href="/">
                        <Image
                            className="mx-2"
                            src={pl500}
                            alt="PolarLearn Logo"
                            height={50}
                            width={50}
                        />
                    </a>

                    {isSearchExpanded || displayConditions.isSearchRoute ? (
                        <ExpandedSearchBar />
                    ) : (
                        <>
                            {/* Desktop navigation */}
                            {displayConditions.showNavLinks && (
                                <>
                                    {/* Mobile menu button */}
                                    <button
                                        className="md:hidden ml-auto p-2 rounded-full hover:bg-neutral-800"
                                        onClick={() => setIsMobileMenuOpen(true)}
                                    >
                                        <Menu size={24} />
                                    </button>

                                    {/* Mobile search button */}
                                    <button
                                        className="md:hidden p-2 rounded-full hover:bg-neutral-800 mr-2"
                                        onClick={handleExpandSearch}
                                    >
                                        <Search size={24} />
                                    </button>
                                    <NavigationLinks
                                        pathname={pathname}
                                        onExpandSearch={handleExpandSearch}
                                    />
                                    {displayConditions.showLoginButton && <LoginButton />}
                                </>
                            )}
                            {displayConditions.showLoginButton && <LoginButton />}
                        </>
                    )}
                </div>
            </nav>

            {/* Mobile menu */}
            < MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                pathname={pathname}
                onExpandSearch={handleExpandSearch}
            />

            <div className="h-16" />
            <style jsx global>{`
        .dropdown-right > div.absolute {
          right: 6px !important;
          top: -24px !important;
        }
        
        /* Ensure smooth transition when impersonation banner appears/disappears */
        nav.fixed {
          transition: top 0.3s ease;
        }
      `}</style>
        </>
    );
});
