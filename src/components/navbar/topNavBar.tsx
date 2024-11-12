//import Link from "next/link";
import Image from "next/image";
import NavBtn from "@/components/navbar/navBtn";
import './../../app/home.css';

export function topNavBar() {
    return (
        <>
            <div className="w-full h-16 bg-neutral-900 sticky top-0 flex items-center fade-in">
                <Image className="ml-4 mr-4 " src="/pl-500.png" alt="PolarLearn Logo" height="50" width="50"/>
                <NavBtn text={"Waarom PolarLearn?"}/>
            </div>
        </>
    );
}