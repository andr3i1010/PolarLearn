"use client";

import React from "react";

interface ButtonProps {
    text: string;
    redirectTo?: string;
    type?: "button" | "submit" | "reset";
}

const Button1: React.FC<ButtonProps> = ({ text, redirectTo, type }) => {
    const handleClick = () => {
        if (redirectTo) {
            window.location.href = redirectTo;
        }
    };

    return (
        <button
            type={type || "button"}
            onClick={type ? undefined : handleClick}
            className="bg-neutral-800 text-white font-bold py-2 px-4 rounded border-4 border-neutral-700 transition-all duration-300 hover:border-sky-400 hover:scale-110">
            {text}
        </button>
    );
};

export default Button1;