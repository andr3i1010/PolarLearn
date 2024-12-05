<<<<<<< Updated upstream
import Image from "next/image";
import NavBtn from "@/components/navbar/navBtn";
import './../../app/home.css';
=======
"use client"
import Image from "next/image";
import NavBtn from "@/components/button/Button1";
import './../../app/home.css';
import pl500 from '@/app/img/pl-500.png';
import { usePathname } from 'next/navigation';
import Link from "next/link";

export function TopNavBar() {
    const pathname = usePathname();
>>>>>>> Stashed changes

export function TopNavBar() {
    return (
<<<<<<< Updated upstream
        <div className="w-full h-16 bg-neutral-900 flex items-center fixed top-0 left-0 z-50 fade-in">
            <Image className="ml-4" src="/pl-500.png" alt="PolarLearn Logo" height="50" width="50"/>
            <div className="flex-grow"></div>
            <div className="mr-4">
                <NavBtn text={"Inloggen"} redirectTo={"/login"}/>
            </div>
=======
        <div className="sticky w-full h-16 bg-neutral-900 flex items-center top-0 left-0 z-50 fade-in font-[family-name:var(--font-geist-sans)] font-bold">
            <Link href="/" prefetch={true}>
                <Image className="ml-4" src={pl500} alt="PolarLearn Logo" height={50} width={50} />
            </Link>
            {process.env.NODE_ENV == "development" && 
                <div className="px-6 text-4xl">
                  <p>BETA</p>
                </div>
            }
            
            {pathname.startsWith("/home") && (
                <div className="flex space-x-4 pr-2">
                    <NavBtn text="Recent" redirectTo="/home/recent" useClNav={true} />
                    <NavBtn text="Forum" redirectTo="/home/forum" useClNav={true} />
                </div>
            )}
            {pathname == "/" && 
            <>
            <div className="flex-grow"></div>
                <div className="flex space-x-4 pr-2">
                   <NavBtn text="Log in" redirectTo="/sign-in" useClNav={false} />
                </div>
            </>
            }
>>>>>>> Stashed changes
        </div>
    );
}