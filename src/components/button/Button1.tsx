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
  disabled?: boolean; // Add disabled prop
}

// Add missing cn utility if not available in your project
function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

const Button1: React.FC<ButtonProps> = ({ text, redirectTo, type, className, useClNav, onClick, disabled = false }) => {
  const handleClick = () => {
    if (redirectTo && !useClNav && !disabled) {
      window.location.href = redirectTo;
    }
  };

  // Create conditional classes for disabled state
  const containerClasses = cn(
    "relative inline-block transition-transform rounded-lg",
    !disabled && "hover:bg-gradient-to-r from-sky-400 to-sky-100 hover:scale-110",
    disabled && "opacity-70 cursor-not-allowed",
    className
  );

  const borderClasses = cn(
    "rounded-lg border-4 border-neutral-700 duration-300",
    !disabled && "hover:border-transparent"
  );

  const buttonClasses = cn(
    "w-full bg-neutral-800 text-white font-bold py-2 px-4 transition-all rounded-md duration-300",
    disabled && "cursor-not-allowed"
  );

  return (
    <div className={containerClasses}>
      <div className={borderClasses}>
        {useClNav === true && redirectTo && !disabled ? (
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
            disabled={disabled}
            className={buttonClasses}>
            {text}
          </button>
        )}
      </div>
    </div>
  );
};

export default Button1;