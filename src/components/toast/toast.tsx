"use client";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, Slide } from "react-toastify";

interface ToastProviderProps {
  children: React.ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <ToastContainer 
        position="top-center"
        autoClose={4000}
        closeOnClick
        pauseOnHover={false}
        transition={Slide}
        theme="dark"
      />
    </>
  );
}