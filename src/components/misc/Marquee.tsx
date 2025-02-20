"use client";
import React, { useEffect, useRef, useState } from 'react';

interface MarqueeProps {
  children: React.ReactNode;
  direction?: "left" | "right";
}

export default function Marquee({ children, direction = "left" }: MarqueeProps) {
  const copyRef = useRef<HTMLDivElement>(null);
  const [copyWidth, setCopyWidth] = useState(0);

  useEffect(() => {
    if (copyRef.current) {
      setCopyWidth(copyRef.current.offsetWidth);
    }
  }, [children]);

  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex animate-marquee"
        style={{
          width: copyWidth ? `${copyWidth * 2}px` : 'auto',
          '--move-distance': `${copyWidth}px`
        } as React.CSSProperties}
      >
        <div ref={copyRef} className="flex flex-none">
          {children}
          <div className="w-4" />
        </div>
        <div className="flex flex-none">
          {children}
          <div className="w-4" />
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-1 * var(--move-distance))); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(calc(-1 * var(--move-distance))); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: ${direction === "right" ? "marquee-right" : "marquee-left"} 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
