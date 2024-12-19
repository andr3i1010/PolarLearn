"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

const dropdownMatrix = [
  ["Groepen", "/home/start"],
  ["Gemaakte lijsten", "/home/forum"],
  ["Vakken", "/sign-in"],
];

interface ButtonProps {
  className?: string;
}

const Button1: React.FC<ButtonProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dropdownWidth, setDropdownWidth] = useState<number>(0);
  const [dropdownHeight, setDropdownHeight] = useState<number>(0); // Track the height of the dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically calculate the dropdown width
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (context) {
      context.font = "bold 16px Arial";
      const maxWidth = dropdownMatrix.reduce((acc, [text]) => {
        const width = context.measureText(text).width;
        return Math.max(acc, width);
      }, 0);
      setDropdownWidth(maxWidth + 32); // Add some padding
    }
  }, []);

  useEffect(() => {
    if (dropdownRef.current) {
      // Set dropdownHeight based on the scrollHeight of the dropdown
      setDropdownHeight(dropdownRef.current.scrollHeight);
    }
  }, [isExpanded]); // Recalculate height whenever the dropdown is expanded

  return (
    <div
      className="absolute inline-block hover:bg-gradient-to-r from-sky-400 to-sky-100 transition-transform rounded-lg transition-all"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Button and Dropdown Wrapper */}
      <div
        className={` rounded-lg border-4 border-neutral-700 duration-300 hover:border-transparent`}
        style={{
          width: `${dropdownWidth}px`,
          height: isExpanded ? `${48 + dropdownHeight}px` : "48px", // Add dropdown height to the main button height
          backgroundColor: isExpanded ? "transparent" : "#26",
        }}
      >
        {/* Main Button */}
        <button
          type="button"
          className=" w-full bg-neutral-800 text-white font-bold py-2 px-4 rounded-t-md"
        >
          Leren
        </button>

        {/* Dropdown */}
        <div
          ref={dropdownRef}
          className={` overflow-hidden transition-all duration-300 ${
            isExpanded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            height: isExpanded ? `${dropdownHeight}px` : "0px",
            width: `${dropdownWidth - 8}px`, // Adjust width to fit within the border
            backgroundColor: "#262626", // neutral-800
            margin: "0 auto", // Ensures it stays centered within the border
            transition: "height 0.3s ease, opacity 0.3s ease",
          }}
        >
          {dropdownMatrix.map(([text, path], index) => (
            <Link
              key={index}
              href={path}
              className=" block px-4 py-2 text-white hover:bg-sky-500 transition-colors duration-200"
            >
              {text}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Button1;