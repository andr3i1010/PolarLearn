import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TopNavBar } from "@/components/navbar/topNavBar";
import { headers } from "next/headers";
import Footer from "@/components/footer/footer";

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

    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        {!hideNavbar && <TopNavBar />}
        {children}
        <Footer />
        </body>
        </html>
    );
}