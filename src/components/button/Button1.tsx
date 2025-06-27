"use client"
import React, { useCallback, ReactNode } from "react";
import Link from "next/link";

interface ButtonProps {
  text: string;
  redirectTo?: string;
  type?: "button" | "submit" | "reset";
  className?: string;
  useClNav?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  wrapText?: boolean;
  textClassName?: string;
  tabIndex?: number;
}

// Add missing cn utility if not available in your project
function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Use React.memo to prevent unnecessary re-renders
const Button1: React.FC<ButtonProps> = React.memo(function Button1({
  text,
  redirectTo,
  type,
  className,
  useClNav,
  onClick,
  disabled = false,
  icon,
  wrapText = false,
  textClassName,
  tabIndex
}) {
  // Use useCallback to memoize the click handler
  const handleClick = useCallback(() => {
    if (redirectTo && !useClNav && !disabled) {
      window.location.href = redirectTo;
    }
    if (onClick && !disabled) {
      onClick();
    }
  }, [redirectTo, useClNav, disabled, onClick]);

  // Create conditional classes for disabled state - memoizing these calculations
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
    "w-full bg-neutral-800 text-white font-bold py-2 px-4 transition-all rounded duration-300",
    disabled && "cursor-not-allowed"
  );

  // Text styling classes - add wrap/clamp option
  const textClasses = cn(
    wrapText
      ? "whitespace-normal break-words line-clamp-2 overflow-hidden"
      : "whitespace-nowrap truncate",
    textClassName
  );

  // Optimize rendering based on link type
  if (useClNav === true && redirectTo && !disabled) {
    return (
      <div className={containerClasses}>
        <div className={borderClasses}>
          <Link
            href={redirectTo}
            tabIndex={tabIndex}
            prefetch={true}
            className="w-full rounded transition-all duration-300 bg-neutral-800 text-white font-bold py-2 px-4 text-center flex items-center justify-center"
          >
            {icon && <span className="mr-2">{icon}</span>}
            <span className={textClasses}>{text}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={borderClasses}>
        <button
          type={type || "button"}
          tabIndex={tabIndex}
          onClick={type ? undefined : handleClick}
          disabled={disabled}
          className={buttonClasses + " flex items-center justify-center"}>
          {icon && <span className="mr-2">{icon}</span>}
          <span className={textClasses}>{text}</span>
        </button>
      </div>
    </div>
  );
});

export default Button1;