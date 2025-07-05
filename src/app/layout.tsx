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
import { cookies } from "next/headers";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { NextStepProvider, NextStep } from "nextstepjs";
import DarkCard from "@/components/DarkCard";
import { getTourState } from "@/serverActions/getTourState";
import TourInitializer from "@/components/TourInitializer";
import TourNavigator from "@/components/TourNavigator";

const steps = [
  {
    tour: "mainTour",
    steps: [
      {
        icon: "📖",
        title: "Welkom bij PolarLearn!",
        content:
          "Welkom bij PolarLearn! Ontdek alle functionaliteiten en voordelen van PolarLearn in deze korte rondleiding.",
        selector: "", // empty selector triggers centered dialog
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🧭",
        title: "Dit is de navigatiebalk",
        content:
          "Hiermee kan je snel naar verschillende delen van de website navigeren, zoals leertools, instellingen en meer.",
        selector: "#navbar",
        side: "right" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "📃",
        title: "Leren keuzelijst",
        content:
          "Beweeg je muis over de keuzelijst om naar een pagina van keuze te gaan. ",
        selector: ".lerendropdown",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🔍",
        title: "Zoekbalk",
        content:
          "Dit is de zoekbalk. Hier kan je lijsten, samenvattingen, forumvragen en groepen vinden. Typ gewoon in wat je zoekt en dan krijg je resultaten.",
        selector: ".searchbar",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🔥",
        title: "Reeks",
        content:
          "Hier kan je je reeks bekijken, oefen dagelijks om je reeks te behouden. Je krijgt ook een bevriezer als je drie dagen achter elkaar oefent.",
        selector: ".streak",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🔔",
        title: "Berichten",
        content:
          "Hier kan je je berichten bekijken en beheren. Tot nu toe krijg je berichten voor als iemand je forumpost leuk vind, er op heeft geantwoord of als een administrator je vraag/antwoord heeft verwijderd.",
        selector: ".notification",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "⚙️",
        title: "Account keuzelijst",
        content:
          "In deze keuzelijst kan je uitloggen, en je account beheren.",
        selector: ".accountdropdown",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "💬",
        title: "Forum",
        content:
          "Klik hier om naar het forum te gaan en discussies te bekijken.",
        selector: "#forumbutton",
        side: "bottom" as const,
        showControls: false,
        showSkip: true,
      },
      {
        icon: "💬",
        title: "Forum",
        content:
          "Hier kan je vragen stellen, antwoorden geven en discussies voeren. Tegenover StudyGo, mag je hier ook chatten, zonder dat een of andere tutor dat verwijdert!",
        selector: "#pixel-area", // target the absolute pixel region
        side: "bottom" as const,
        showControls: true,
        showSkip: false,
      },
      {
        icon: "🏠",
        title: "Ga terug naar Start",
        content: "Klik hier om terug te keren naar de startpagina.",
        selector: ".startbutton",
        side: "bottom" as const,
        showControls: false,
        showSkip: true,
        clickThroughOverlay: true,
      },
      {
        icon: "📃",
        title: "Overzicht Lijsten",
        content: (
          <div className="w-full flex flex-col">
            <p>Hier komen je recent bekeken/geoefende lijsten te staan.</p>
            <p>Zo komt het eruit te zien:</p>
            <img
              src="https://cdn.polarlearn.tech/listpreview.png"
              alt="Overzicht lijsten"
              className="mt-4 w-60 h-auto rounded-lg"
            />
          </div>
        ),
        selector: "",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🎉",
        title: "Klaar!",
        content:
          "Je bent klaar met de rondleiding! Je kunt nu beginnen met het gebruiken van PolarLearn.",
        selector: "",
        showControls: true,
        showSkip: true,
      },
    ],
  },
];

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const hasSG = cookieStore.has("SG");
  return {
    title: hasSG ? "Studygo" : "PolarLearn",
    description:
      "PolarLearn is de gratis en Open-Source leerprogramma, gemaakt voor, en door studenten.",
    authors: [
      { name: "andrei1010", url: "https://andrei1010.me" },
      { name: "supersiem", url: "https://siemvk.nl/" },
    ],
    icons: [
      {
        url: hasSG
          ? `${process.env.NEXT_PUBLIC_URL}/SG.png`
          : `${process.env.NEXT_PUBLIC_URL}/icon.png`,
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
}
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
  const { finishedTour } = await getTourState();
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
        {/* <head>
          <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        </head> */}
        <body className="antialiased flex flex-col min-h-screen">
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
            {!finishedTour ? (
              <NextStepProvider>
                <TourInitializer tourName="mainTour" />
                <NextStep steps={steps} cardComponent={DarkCard}>
                  <TourNavigator />
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
                        {/* Anchor first step to the navbar */}
                        <div id="navbar">
                          <TopNavBar />
                        </div>
                        <div>{children}</div>
                      </>
                      {footerContent}
                      <AnalyticsProvider />
                    </WSProvider>
                  </ToastProvider>
                </NextStep>
              </NextStepProvider>
            ) : (
              <ToastProvider>
                <WSProvider>
                  <>
                    <ImpersonationCheck />
                    <ImpersonationStyles />
                    {/* Anchor first step to the navbar */}
                    <div id="navbar">
                      <TopNavBar />
                    </div>
                    <div>{children}</div>
                  </>
                  {footerContent}
                  <AnalyticsProvider />
                </WSProvider>
              </ToastProvider>
            )}
          </SessionWrapper>
        </body>
      </html>
    </ViewTransitions>
  );
}
