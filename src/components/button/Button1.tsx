"use client"
import React from "react";
import Link from "next/link";

interface ButtonProps {
  text: string;
  redirectTo?: string;
  type?: "button" | "submit" | "reset";
  className?: string;
  useClNav?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const Button1: React.FC<ButtonProps> = ({ text, redirectTo, type, className, useClNav, onClick }) => {
  const handleClick = () => {
    if (redirectTo && !useClNav) {
      window.location.href = redirectTo;
    }
  };
  return (
    <div className={`relative inline-block hover:bg-gradient-to-r from-sky-400 to-sky-100 transition-transform hover:scale-110 rounded-lg  ${className}`}>
      <div className="rounded-lg border-4 border-neutral-700 duration-300 hover:border-transparent">
        {useClNav == true && redirectTo ? (
          <Link
            href={redirectTo}
            prefetch={true}
            className="block w-full rounded transition-all duration-300 bg-neutral-800 text-white font-bold py-2 px-4 text-center"
          >
            {text}
          </Link>
        ) : (
          <button
            type={type || "button"}
            onClick={type ? undefined : (onClick || handleClick)}
            className="w-full bg-neutral-800 text-white font-bold py-2 px-4 transition-all duration-300">
            {text}
          </button>
        )}
      </div>
    </div>
  );
};

export default Button1;