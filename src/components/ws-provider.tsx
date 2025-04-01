"use client";
import { useEffect, useState, createContext, useContext } from "react";

const WSContext = createContext<WebSocket | null>(null);

export function WSProvider({ children }: { children: React.ReactNode }) {
  const baseUrl = process.env.NEXT_PUBLIC_URL as string;
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = baseUrl + "/api/ws";
    const socket = new WebSocket(wsUrl);

    socket.addEventListener("open", () => {
      socket.send("connect");
    });
    socket.addEventListener("error", (err) => {
      console.error("WS error:", err);
    });
    socket.addEventListener("close", () => {
      console.log("WS connection closed");
    });

    setWs(socket);
    return () => {
      socket.close();
    };
  }, [baseUrl]);

  return <WSContext.Provider value={ws}>{children}</WSContext.Provider>;
}

export function useWS() {
  return useContext(WSContext);
}
