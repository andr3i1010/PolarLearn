"use clients"
import Image from "next/image";
import NavBtn from "@/components/button/button1";
import './../../app/home.css';
import pl500 from '@/app/img/pl-500.png';
import { checkDev } from '@/utils/checkdev';

export async function TopNavBar() {

    return (
        <div className="w-full h-16 bg-neutral-900 flex items-center fixed top-0 left-0 z-50 fade-in font-[family-name:var(--font-geist-sans)] font-bold">
            <Image className="ml-4" src={pl500} alt="PolarLearn Logo" height={50} width={50} />
            {process.env.NODE_ENV == "development" && <div className="px-6 text-4xl">
                <p>BETA</p>
            </div>}
            <div className="flex-grow"></div>
            <div className="mr-4">
                <NavBtn text={"Inloggen"} redirectTo={"/sign-in"}/>
            </div>
        </div>
    );
}