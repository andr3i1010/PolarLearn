import type { Metadata } from "next";
import "./globals.css";
import { TopNavBar } from "@/components/navbar/TopNavBar";
import Footer from "@/components/footer/Footer";
import { Geist } from "next/font/google";
import ToastProvider from "@/components/toast/toast";
import { WSProvider } from "../components/ws-provider";
import Head from "next/head";
import SessionWrapper from "@/components/SessionWrapper";
import ImpersonationCheck from "@/components/ImpersonationCheck";
import ImpersonationStyles from "@/components/ImpersonationStyles";
import React from "react";
import { ViewTransitions } from "next-view-transitions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PolarLearn",
  description:
    "PolarLearn is de gratis en Open-Source leerprogramma, gemaakt voor, en door studenten.",
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
  manifest: "/manifest.json",
  applicationName: "PolarLearn",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PolarLearn",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#38bdf8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
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

  // Pre-render Footer outside React tree to prevent re-renders
  const footerContent = await Footer();

  return (
    <ViewTransitions>
      <html lang="nl" className={`${geistSans.className} antialiased`}>
        <Head>
          <link rel="icon" href="/favicon.png" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
        </Head>
        <body className={`antialiased flex flex-col min-h-screen `}>
          <noscript>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white text-center p-4">
              <div className="flex flex-col items-center">
                <p className="text-6xl pb-4">❌</p>

                <p className="text-xl">
                  PolarLearn werkt niet zonder JavaScript. Zet JavaScript aan om
                  verder te gaan.
                </p>
              </div>
            </div>
          </noscript>
          <div
            style={{ display: "none" }}
            dangerouslySetInnerHTML={{ __html: art }}
          />
          <SessionWrapper>
            <ToastProvider>
              <WSProvider>
                {/* <div className="md:hidden fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white text-center p-4">
                <div className="flex flex-col items-center">
                  <p className="text-6xl">⚠️</p>
                  <br />
                  <p className="text-xl">
                    PolarLearn werkt slecht op kleine schermen. Als je geen groter scherm hebt, probeer de tekstgroote te verminderen en je telefoon in liggende modus te zetten.
                  </p>
                </div>
              </div> */}
                <>
                  <ImpersonationCheck />
                  <ImpersonationStyles />
                  <TopNavBar />
                  <div>
                    {children}
                  </div>
                </>
                {footerContent}
              </WSProvider>
            </ToastProvider>
          </SessionWrapper>
        </body>
      </html>
    </ViewTransitions>
  );
}
