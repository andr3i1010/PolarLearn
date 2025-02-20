import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TopNavBar } from "@/components/navbar/TopNavBar";
import Footer from "@/components/footer/Footer";
import { checkDev } from "@/utils/datatool";
import Button1 from "@/components/button/Button1";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/utils/auth";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "PolarLearn",
    description: "Beter dan studygo frfr "
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const headerslist = await headers();
    const currentPath = headerslist.get('x-current-path') || '/';
    const polarUrl = process.env.POLARLEARN_URL;
    const session = await auth();
    const isDev = process.env.NODE_ENV === "production" || await checkDev()
    const art = `                                          
                                           __ 
 _____     _         __                   |  |
|  _  |___| |___ ___|  |   ___ ___ ___ ___|  |
|   __| . | | .'|  _|  |__| -_| .'|  _|   |__|
|__|  |___|_|__,|_| |_____|___|__,|_| |_|_|__|
    `;    
    return isDev ? (
        <html lang="en" className={`${geistSans.className} antialiased`}>
            <body
                className={`antialiased flex flex-col min-h-screen `}
            >
                <SessionProvider session={session}>

                    <div
                        className=" md:hidden fixed inset-0 z-50 flex items-center justify-center bg-black text-white text-center p-4">
                        <div className="flex flex-col items-center">
                            <p className="text-6xl">⚠️</p>
                            <br />
                            <p className="text-xl">PolarLearn kan niet gebruikt worden op mobiele apparaten of op kleine schermen. Er wordt gewerkt aan deze functionaliteit.</p>
                        </div>
                    </div>
                    <TopNavBar pathname={currentPath}/>
                    <div className="h-16"/>
                    <div
                    style={{display: 'none'}}
                    dangerouslySetInnerHTML={{ __html: art }}
                    ></div>
                    {children}
                    <footer className="mt-auto">
                        {await Footer()}
                    </footer>
                </SessionProvider>
            </body>
        </html>
    ) : (
        <html lang="en">
            <body
                className={`antialiased`}
            >
                <div
                    className=" fixed inset-0 z-50 flex items-center justify-center bg-black text-white text-center p-4">
                    <div className="flex flex-col items-center">
                        <p className="text-6xl">⛔</p>
                        <br />
                        <p className="text-xl">Je hebt geen toegang tot de beta-build van PolarLearn. <br />Als je hebt gedoneerd of een administrator bent, log dan eerst in op <a href={polarUrl} target="_blank" rel="noopener noreferrer">{polarUrl}</a></p>
                        <div className="pt-11">
                            <Button1 text={String(polarUrl)} useClNav={false} redirectTo={polarUrl} />
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}