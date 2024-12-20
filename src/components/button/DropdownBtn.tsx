"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { relative } from "path";

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
  const [dropdownHeight, setDropdownHeight] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMouseOverDropdown = useRef(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (context) {
      context.font = "bold 16px Arial";
      const maxWidth = dropdownMatrix.reduce((acc, [text]) => {
        const width = context.measureText(text).width;
        return Math.max(acc, width);
      }, 0);
      setDropdownWidth(maxWidth + 32);
    }
  }, []);

  useEffect(() => {
    if (dropdownRef.current) {
      setDropdownHeight(dropdownRef.current.scrollHeight);
    }
  }, [isExpanded]);

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeave = (event: React.MouseEvent) => {
    if (!isMouseOverDropdown.current) {
      setIsExpanded(false);
    }
  };

  const handleDropdownMouseEnter = () => {
    isMouseOverDropdown.current = true;
  };

  const handleDropdownMouseLeave = (event: React.MouseEvent) => {
    isMouseOverDropdown.current = false;
    setIsExpanded(false);
  };

  return (
    <div
      className="absolute inline-block hover:bg-gradient-to-r from-sky-400 to-sky-100 transition-transform rounded-lg"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{margin: "0px 220px"}}
    >
      <div
        className={`rounded-lg border-4 border-neutral-700 duration-300 hover:border-transparent`}
        style={{
          width: `${dropdownWidth}px`,
          height: isExpanded ? `${48 + dropdownHeight}px` : "48px",
          backgroundColor: isExpanded ? "transparent" : "#26",
        }}
      >
        <button
          type="button"
          className="w-full bg-neutral-800 text-white font-bold py-2 px-4 rounded-t-md"
        >
          Leren
        </button>

        <div
          ref={dropdownRef}
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? "opacity -100" : "opacity-0"
          }`}
          style={{
            height: isExpanded ? `${dropdownHeight}px` : "0px",
            width: `${dropdownWidth - 8}px`,
            backgroundColor: "#262626",
            margin: "0 auto",
            transition: "height 0.3s ease, opacity 0.3s ease",
          }}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          {dropdownMatrix.map(([text, path], index) => (
            <Link
              key={index}
              href={path}
              className="block px-4 py-2 text-white hover:bg-sky-500 transition-colors duration-200"
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