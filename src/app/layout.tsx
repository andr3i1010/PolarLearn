import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import {topNavBar} from "@/components/navbar/topNavBar";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      {topNavBar()}
        {children}
      </body>
    </html>
  );
}