import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TopNavBar } from "@/components/navbar/TopNavBar";
import { headers } from "next/headers";
import Footer from "@/components/footer/Footer";
import { checkDev } from "@/utils/datatool";
import Button1 from "@/components/button/Button1";
import { Toaster } from "react-hot-toast";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

const twEmoji = localFont({
    src: './fonts/TwitterColorEmoji-SVGinOT.ttf',
    variable: '--font-twemoji'
})

export const metadata: Metadata = {
    title: "PolarLearn",
    description: "Beter dan studygo frfr 🔥🔥🔥",
};

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    const headersList = await headers();
    const hideNavbar = headersList.get('x-hide-navbar') === 'true';
    const polarUrl = process.env.POLARLEARN_URL;

    return await checkDev() ? (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
            >
                <div
                    className=" md:hidden fixed inset-0 z-50 flex items-center justify-center bg-black text-white text-center p-4">
                    <div className="flex flex-col items-center">
                        <p className="text-6xl">⚠️</p>
                        <br/>
                        <p className="text-xl">PolarLearn kan niet gebruikt worden op mobiele apparaten of op kleine schermen.</p>
                    </div>
                </div>
                <Toaster position="bottom-center" />
            <nav>
                {!hideNavbar && <TopNavBar />}
            </nav>
            {children}
            <footer className="mt-auto">
                {await Footer()}
            </footer>
            </body>
        </html>
    ) : (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <div
                    className=" fixed inset-0 z-50 flex items-center justify-center bg-black text-white text-center p-4">
                    <div className="flex flex-col items-center">
                        <p className="text-6xl">⛔</p>
                        <br/>
                        <p className="text-xl">Je hebt geen toegang tot de beta-build van PolarLearn. <br/>Als je hebt gedoneerd of een administrator bent, log dan eerst in op <a href={polarUrl} target="_blank" rel="noopener noreferrer">{polarUrl}</a></p>
                        <div className="pt-11">
                            <Button1 text={String(polarUrl)} useClNav={false} redirectTo={polarUrl} />
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}