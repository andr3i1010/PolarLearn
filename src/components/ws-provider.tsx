"use client";
import { useEffect, useState, createContext, useContext } from "react";

const WSContext = createContext<WebSocket | null>(null);

export function WSProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      const baseUrl = `${process.env.NODE_ENV === "production" ? "https://" : "http://"}${window.location.host}`;
      const wsUrl = baseUrl + "/api/ws";
      const socket = new WebSocket(wsUrl);

      socket.addEventListener("open", () => {
        // socket.send("iets");
      });
      socket.addEventListener("error", (err) => {
        console.error("WebSocket error:", err);
        // reconnect to the socket immediately after an error, 3 attempts max
        let attempts = 0;
        const reconnect = () => {
          if (attempts < 3) {
            attempts++;
            console.log(`Reconnecting... Attempt ${attempts}`);
            const newSocket = new WebSocket(wsUrl);
            newSocket.addEventListener("open", () => {
              console.log("Reconnected to WebSocket");
              setWs(newSocket);
            });
            newSocket.addEventListener("error", reconnect);
          } else {
            console.error("Max reconnection attempts reached");
          }
        }
        reconnect();
      });
      socket.addEventListener("close", () => {
        console.log("WebSocket connection closed");
      });

      setWs(socket);
      return () => {
        socket.close();
      };
    }
  }, []); // Removed baseUrl dependency since it's now inside the effect

  return <WSContext.Provider value={ws}>{children}</WSContext.Provider>;
}

export function useWS() {
  return useContext(WSContext);
}
