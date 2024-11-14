import Image from "next/image";
import NavBtn from "@/components/navbar/navBtn";
import './../../app/home.css';

export function TopNavBar() {
    return (
        <div className="w-full h-16 bg-neutral-900 flex items-center fixed top-0 left-0 z-50 fade-in">
            <Image className="ml-4" src="/pl-500.png" alt="PolarLearn Logo" height="50" width="50"/>
            <div className="flex-grow"></div>
            <div className="mr-4">
                <NavBtn text={"Inloggen"} redirectTo={"/login"}/>
            </div>
        </div>
    );
}