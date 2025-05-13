"use client";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, Slide } from "react-toastify";
import { CircleX, Check, TriangleAlert, CircleCheck, Info } from "lucide-react";

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
        stacked
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        transition={Slide}
        theme="colored"
        style={{
          borderRadius: "100%",
          width: "400px", 
          maxWidth: "90vw"
        }}
        icon={({ type, theme }) => {
          switch (type) {
            case "success":
              return <CircleCheck />;
            case "error":
              return <CircleX />;
            case "success":
              return <Check />;
            case "warning":
              return <TriangleAlert />;
            case "info":
              return <Info />;
          }
        }}
      />
    </>
  );
}