"use client";
import { useEffect, useState } from 'react';
import Image from "next/image";
import NavBtn from "@/components/button/button1";
import './../../app/home.css';
import pl500 from '@/app/img/pl-500.png';

export function TopNavBar() {
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsername = async () => {
            try {
                const response = await fetch('/api/auth/user');
                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.username);
                }
            } catch (error) {
                console.error('Error fetching username:', error);
            }
        };

        fetchUsername();
    }, []);

    return (
        <div className="w-full h-16 bg-neutral-900 flex items-center fixed top-0 left-0 z-50 fade-in">
            <Image className="ml-4" src={pl500} alt="PolarLearn Logo" height={50} width={50} />
            <div className="flex-grow"></div>
            {username && <div className="mr-4 text-white">Welcome, {username}</div>}
            <div className="mr-4">
                <NavBtn text={"Inloggen"} redirectTo={"/sign-in"}/>
            </div>
        </div>
    );
}