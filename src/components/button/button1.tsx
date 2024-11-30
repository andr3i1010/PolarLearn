"use client"
import React from "react";

interface ButtonProps {
    text: string;
    redirectTo?: string;
    type?: "button" | "submit" | "reset";
    className?: string;
}

const Button1: React.FC<ButtonProps> = ({ text, redirectTo, type, className }) => {
    const handleClick = () => {
        if (redirectTo) {
            window.location.href = redirectTo;
        }
    };

    return (
        <div className="relative inline-block hover:bg-gradient-to-r from-sky-400 to-sky-100 transition-transform hover:scale-110 rounded-md transition-all">
            <div className="rounded-lg border-4 border-neutral-700 duration-300 hover:border-transparent">
                <button
                    type={type || "button"}
                    onClick={type ? undefined : handleClick}
                    className={`bg-neutral-800 text-white font-bold py-2 px-4 rounded transition-all duration-300 ${className}`}>
                    {text}
                </button>
            </div>
        </div>
    );
};

export default Button1;