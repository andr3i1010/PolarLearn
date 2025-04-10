"use client"
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import NavBtn from "@/components/button/Button1";
import pl500 from "@/app/img/pl-500.png";
import DropdownBtn from "@/components/button/DropdownBtn";
import { usePathname } from 'next/navigation'

const dropdownMatrixStart: [React.ReactNode, string][] = [
    ["Groepen", "/home/start"],
    ["Gemaakte lijsten", "/home/forum"],
    ["Vakken", "/learn/subjects"],
];

// Memoized navigation links component
const NavigationLinks = memo(({ pathname }: { pathname: string }) => (
    <>
        <NavBtn text="Start" redirectTo="/home/start" useClNav={true} />
        <NavBtn text="Forum" redirectTo="/home/forum" useClNav={true} />
        <div className="relative block mb-12" style={{ textAlign: "left" }}>
            <DropdownBtn selectorMode={false} text={"Leren"} dropdownMatrix={dropdownMatrixStart} />
        </div>
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

    // Use useMemo for display conditions to prevent recalculations on every render
    const displayConditions = useMemo(() => {
        const showOnViewList = pathname.startsWith('/learn/viewlist');
        const showOnSubjects = pathname.startsWith('/learn/subjects');
        const hideOnCreateList = pathname === "/home/createlist";
        const showOnHomeRoutes = pathname === "/" || pathname.startsWith("/home");

        return {
            showOnViewList,
            showOnSubjects,
            hideOnCreateList,
            showOnHomeRoutes,
            shouldRender: showOnViewList || showOnSubjects || !(hideOnCreateList || !showOnHomeRoutes),
            showNavLinks: pathname.startsWith("/home") || showOnViewList || showOnSubjects,
            showLoginButton: pathname === "/"
        };
    }, [pathname]);

    if (!displayConditions.shouldRender) {
        return null;
    }

    return (
        <>
            <nav className="fixed top-0 min-w-full shadow-md start-0 max-w-screen-xl z-[100] flex flex-wrap justify-between h-16 bg-neutral-900/70 backdrop-blur-sm items-center fade-in font-[family-name:var(--font-geist-sans)] font-bold">
                <div className="flex items-center space-x-4 w-full">
                    <a href="/">
                        <Image className="mx-2" src={pl500} alt="PolarLearn Logo" height={50} width={50} />
                    </a>
                    {process.env.NODE_ENV === "development" && (
                        <div className="text-4xl">
                            <p>BETA</p>
                        </div>
                    )}
                    {displayConditions.showNavLinks && <NavigationLinks pathname={pathname} />}
                    {displayConditions.showLoginButton && <LoginButton />}
                </div>
            </nav>
            <div className="h-16" />
            <style jsx global>{`
                .dropdown-right > div.absolute {
                    right: 6px !important;
                    top: -24px !important;
                }
            `}</style>
        </>
    );
});