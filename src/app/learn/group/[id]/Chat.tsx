"use client";

import { Send } from "lucide-react";
import { GroupChatContent } from "./page";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWS } from "@/components/ws-provider";
import { toast } from "react-toastify";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";

export type ChatSendMessage = {
  event: "chat";
  group: string;
  message: string;
};

export default function Chat({
  chatContent,
}: {
  chatContent: GroupChatContent[];
}) {
  const path = usePathname();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const websocket = useWS();
  const [inputValue, setInputValue] = React.useState("");
  const [messages, setMessages] = React.useState<GroupChatContent[]>(chatContent);

  useEffect(() => {
    setMessages(chatContent);
  }, [chatContent]);

  useEffect(() => {
    if (!websocket) {
      return;
    }

    const subscribeToPage = () => {
      console.log("Sending subscription message to:", path);
      websocket.send(
        JSON.stringify({
          event: "subscribe",
          page: path,
        })
      );
      console.log("Subscription message sent");
    };

    // Handle incoming messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);

        if (data.type === "chat-message") {
          // Add new message to the chat
          setMessages(prev => [...prev, data.message]);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    // If already open, subscribe immediately
    if (websocket.readyState === WebSocket.OPEN) {
      subscribeToPage();
    } else {
      // Otherwise, wait for the connection to open
      const handleOpen = () => {
        subscribeToPage();
      };

      websocket.addEventListener('open', handleOpen);

      // Cleanup
      return () => {
        websocket.removeEventListener('open', handleOpen);
      };
    }

    // Add message listener
    websocket.addEventListener('message', handleMessage);

    // Cleanup message listener
    return () => {
      websocket.removeEventListener('message', handleMessage);
    };
  }, [websocket, path]);

  return (
    <div className="ml-2 w-full items-center flex justify-center flex-col">
      <div className="w-130">
        {messages.length === 0 ? (
          <div className="text-neutral-400 text-center p-6 rounded-lg">
            Er zijn nog geen berichten in deze groepschat.
          </div>
        ) : (
          <ScrollArea className="h-96 w-full">
            {messages.map((chatItem, i) => (
              <div key={i} className="mb-4 p-3 bg-neutral-800 rounded-lg">
                <div className="text-sm text-neutral-400 mb-1">
                  {chatItem.creator} -{" "}
                  {new Date(chatItem.time).toLocaleString()}
                </div>
                <div className="text-neutral-200">{chatItem.content}</div>
              </div>
            ))}
          </ScrollArea>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="p-2 bg-neutral-800 rounded-lg w-full"
          placeholder="Typ een nieuw bericht..."
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <Send
          className={`text-neutral-200 transition-colors ${!inputValue.trim()
            ? "opacity-50 cursor-not-allowed"
            : "hover:text-neutral-400 cursor-pointer"
            }`}
          onClick={() => {
            if (!websocket || websocket.readyState !== WebSocket.OPEN) {
              toast.error(
                "WebSocket verbinding is niet beschikbaar. Je kunt momenteel geen berichten versturen."
              );
              return;
            }
            const message = inputValue.trim();
            if (!message) {
              return; // Don't send empty messages
            }
            console.log("Sending chat message:", {
              event: "chat",
              group: path.split("/")[3],
              message: message,
            });
            websocket.send(
              JSON.stringify({
                event: "chat",
                group: path.split("/")[3],
                message: message,
              })
            );
            console.log("Chat message sent");
            setInputValue("");
          }}
        />
      </div>
    </div>
  );
}
