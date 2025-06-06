"use client";
import { useEffect, useState, createContext, useContext } from "react";

const WSContext = createContext<WebSocket | null>(null);
import { usePathname } from "next/navigation";
import Cookies from 'js-cookie';

export function WSProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const path = usePathname();

  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      const baseUrl = `${process.env.NODE_ENV === "production" ? "wss://" : "ws://"}${window.location.host}`;
      const wsUrl = baseUrl + "/api/ws";
      let attempts = 0;

      const createConnection = () => {
        const socket = new WebSocket(wsUrl);

        socket.addEventListener("open", () => {
          console.log("WebSocket connected - authentication handled server-side");
          attempts = 0; // Reset attempts on successful connection
        });

        socket.addEventListener("message", (event) => {
          console.log("WebSocket message received:", event.data);
          try {
            const data = JSON.parse(event.data);
            console.log("Parsed message data:", data);
            if (data.type === "auth") {
              console.log("Authentication status:", data.authenticated);
              if (data.authenticated && data.user) {
                console.log(`Authenticated as user: ${data.user.email}`);
              }
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        });

        socket.addEventListener("error", (err) => {
          console.error("WebSocket error:", err);

          const reconnect = () => {
            if (attempts < 3) {
              attempts++;
              console.log(`Reconnecting... Attempt ${attempts}`);
              setTimeout(() => {
                const newSocket = createConnection();
                setWs(newSocket);
              }, 1000 * attempts); // Exponential backoff
            } else {
              console.error("Max reconnection attempts reached");
            }
          };
          reconnect();
        });

        socket.addEventListener("close", (event) => {
          console.log("WebSocket connection closed", event.code, event.reason);
          // Only attempt to reconnect if it wasn't a clean close
          if (event.code !== 1000 && attempts < 3) {
            attempts++;
            console.log(`Connection closed, reconnecting... Attempt ${attempts}`);
            setTimeout(() => {
              const newSocket = createConnection();
              setWs(newSocket);
            }, 1000 * attempts);
          }
        });

        return socket;
      };

      const socket = createConnection();
      setWs(socket);

      return () => {
        socket.close(1000, "Component unmounting");
      };
    }
  }, []);

  return <WSContext.Provider value={ws}>{children}</WSContext.Provider>;
}

export function useWS() {
  return useContext(WSContext);
}
