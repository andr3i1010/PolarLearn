import type { Metadata } from "next";
import "./globals.css";
import { TopNavBar } from "@/components/navbar/TopNavBar";
import Footer from "@/components/footer/Footer";
import { Geist } from "next/font/google";
import ToastProvider from "@/components/toast/toast";
import { WSProvider } from "../components/ws-provider";
import Head from "next/head";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PolarLearn",
  description:
    "PolarLearn is de gratis en Open-Source leerprogramma, gemaakt voor, en door en voor studenten.",
  authors: [
    { name: "andrei1010", url: "https://andrei1010.me" },
    { name: "supersiem", url: "https://siemvk.nl/" },
  ],
  icons: [
    {
      url: `${process.env.NEXT_PUBLIC_URL}/icon.png`,
      type: "image/png",
      rel: "icon",
    },
  ],
  keywords: [
    "PolarLearn",
    "Leerprogramma",
    "StudyGo",
    "leren",
    "studeren",
    "studie",
    "school",
    "studenten",
    "gratis",
    "open-source",
  ],
  creator: "andrei1010",
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: "https://polarlearn.tech",
    title: "PolarLearn",
    description:
      "PolarLearn is de gratis en Open-Source leerprogramma, gemaakt voor, en door studenten.",
    siteName: "PolarLearn",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_URL}/banner.png`,
        width: 1200,
        height: 630,
        alt: "PolarLearn banner dingo",
      },
    ],
  },
};

export const viewport = {
  themeColor: "#38bdf8",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const art = `                                          
                                               __ 
     _____     _         __                   |  |
    |  _  |___| |___ ___|  |   ___ ___ ___ ___|  |
    |   __| . | | .'|  _|  |__| -_| .'|  _|   |__|
    |__|  |___|_|__,|_| |_____|___|__,|_| |_|_|__|


    <!-- 

        Hallo daar, developer!
    
        Voel je vrij om in de gegenereerde HTML-code te kijken. 
        
        De jsx-* classes zijn client-componenten, dus interactief. De rest van de classes zijn van TailwindCSS.

        PolarLearn is FOSS, dus je kunt de code bekijken op GitHub: https://github.com/polarnl/polarlearn

        Groetjes, andrei1010 en de rest van het PolarLearn team

    -->
    `;
  return (
    <html lang="en" className={`${geistSans.className} antialiased`}>
      <Head>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <body className={`antialiased flex flex-col min-h-screen `}>
        <div
          style={{ display: "none" }}
          dangerouslySetInnerHTML={{ __html: art }}
        />
        <ToastProvider>
          <WSProvider>
            <div className="md:hidden fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white text-center p-4">
              <div className="flex flex-col items-center">
                <p className="text-6xl">⚠️</p>
                <br />
                <p className="text-xl">
                  PolarLearn kan niet gebruikt worden op mobiele apparaten of op
                  kleine schermen. Er wordt gewerkt aan deze functionaliteit.
                </p>
              </div>
            </div>
            <TopNavBar />
            {children}
            {await Footer()}
          </WSProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
