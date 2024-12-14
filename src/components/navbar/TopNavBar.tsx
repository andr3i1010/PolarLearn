"use client"; // Client-side component

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import NavBtn from "@/components/button/Button1";
import pl500 from "@/app/img/pl-500.png";
import { usePathname } from "next/navigation";

export function TopNavBar() {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const [isNavVisible, setIsNavVisible] = useState(true);

  // Handle client-only rendering
  useEffect(() => {
    setIsMounted(true);  // Set mounted flag to true after component is mounted on the client
  }, []);

  const toggleNav = () => {
    console.log("Toggle clicked!");
    setIsNavVisible((prevState) => !prevState);
  };

  // Define paths where the navbar should be hidden
  const hiddenPaths = ["/sign-in", "/sign-up", "/404", "/500", "/error"];

  // Memoize this value for better performance on repeated renders
  const shouldHideNav = useMemo(
    () => isMounted && hiddenPaths.some((hiddenPath) => pathname.startsWith(hiddenPath)),
    [isMounted, pathname] // Recalculate only when these change
  );

  // If the navbar should be hidden, return null
  if (shouldHideNav) {
    return null;
  }

  // Now, render only if mounted on the client to avoid hydration issues
  if (!isMounted) {
    return null;  // Ensure it renders nothing on the server
  }

  return (
    <div className="sticky w-full h-16 bg-neutral-900 flex items-center top-0 left-0 z-50 fade-in font-[family-name:var(--font-geist-sans)] font-bold">
      <a href="/">
        <Image className="ml-4" src={pl500} alt="PolarLearn Logo" height={50} width={50} />
      </a>
      {process.env.NODE_ENV === "development" && (
        <div className="px-6 text-4xl">
          <p>BETA</p>
        </div>
      )}

      {/* /home path logic */}
      {pathname.startsWith("/home") && (
        <div className={`flex space-x-4 pr-2 ${isNavVisible ? "" : "hidden"}`}>
          <NavBtn text="Recent" redirectTo="/home/recent" useClNav={true} />
          <NavBtn text="Forum" redirectTo="/home/forum" useClNav={true} />
        </div>
      )}

      {/* / path logic */}
      {pathname === "/" && (
        <>
          <div className="flex-grow"></div>
          <div className="flex space-x-4 pr-2">
            <NavBtn text="Log in" redirectTo="/sign-in" useClNav={false} />
          </div>
        </>
      )}
    </div>
  );
}
