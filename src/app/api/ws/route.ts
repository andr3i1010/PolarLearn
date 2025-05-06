export function SOCKET(
  client: import("ws").WebSocket,
  request: import("http").IncomingMessage,
  server: import("ws").WebSocketServer
) {
  client.on("message", (message) => {
    try {
      const msg = typeof message === "string"
        ? message
        : Array.isArray(message)
          ? Buffer.concat(message).toString("utf8")
          : typeof message === "object" && "toString" in message
            ? message.toString("utf8")
            : "";
      
    } catch (error) {
      console.error("Error processing WS message:", error);
    }
  });
}