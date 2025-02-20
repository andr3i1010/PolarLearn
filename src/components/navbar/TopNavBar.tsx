import Image from "next/image";
import NavBtn from "@/components/button/Button1";
import pl500 from "@/app/img/pl-500.png";
import DropdownBtn from "@/components/button/DropdownBtn";
const dropdownMatrixStart: [React.ReactNode, string][] = [
    ["Groepen", "/home/start"],
    ["Gemaakte lijsten", "/home/forum"],
    ["Vakken", "/sign-in"],
];
export function TopNavBar({ pathname }: { pathname: string }) {
    if (pathname === "/home/createlist" || (pathname !== "/" && !pathname.startsWith("/home"))) {
        return null;
    }
    return (
        <nav className="fixed top-0 min-w-full shadow-md start-0 max-w-screen-xl z-50 flex flex-wrap justify-between h-16 bg-neutral-900/70 backdrop-blur-sm items-center fade-in font-[family-name:var(--font-geist-sans)] font-bold">
            <a href="/">
                <Image className="ml-4" src={pl500} alt="PolarLearn Logo" height={50} width={50} />
            </a>
            {process.env.NODE_ENV === "development" ? (
                <div className="px-6 text-4xl">
                    <p>BETA</p>
                </div>
            )
                : (
                    <div className="w-4"></div>
                )
            }
            {pathname && pathname.startsWith("/home") && (
                <>
                    <div className={`flex relative space-x-4`}>
                        <NavBtn text="Recent" redirectTo="/home/start" useClNav={true} />
                        <NavBtn text="Forum" redirectTo="/home/forum" useClNav={true} />
                        <div className="relative">
                            <DropdownBtn selectorMode={false} text={"Leren"} dropdownMatrix={dropdownMatrixStart} />
                        </div>
                    </div>
                    <div className="flex-grow"></div>
                    <div className="flex space-x-4 pr-2">
                        <NavBtn text="Log out" redirectTo="/auth/sign-out" useClNav={false} />
                    </div>
                </>
            )}
            {pathname === "/" && (
                <>
                    <div className="flex-grow"></div>
                    <div className="flex space-x-4 pr-2">
                        <NavBtn text="Log in" redirectTo="/auth/sign-in" useClNav={false} className="" />
                    </div>
                </>
            )}
        </nav>
    );
}
