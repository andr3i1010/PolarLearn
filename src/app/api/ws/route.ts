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
          : message.toString("utf8");
      if (msg === "connect") {
        client.send("OK");
      }
    } catch (error) {
      console.error("Error processing WS message:", error);
    }
  });
}