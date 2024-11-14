"use client";

import React from "react";

interface ButtonProps {
    text: string;
    redirectTo: string;
}

const navBtn: React.FC<ButtonProps> = ({ text, redirectTo }) => {
    return (
        <button
            onClick={() => window.location.href = redirectTo}
            className="bg-neutral-800 text-white font-bold py-2 px-4 rounded border-4 border-neutral-700 transition-all duration-300 hover:border-sky-400 hover:scale-110">
            {text}
        </button>
    );
};

export default navBtn;