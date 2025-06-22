import { getUserFromSession } from "@/utils/auth/auth";

export function GET() {
  const headers = new Headers();
  headers.set('Connection', 'Upgrade');
  headers.set('Upgrade', 'websocket');
  return new Response('Upgrade Required', { status: 426, headers });
}

export async function SOCKET(
  client: import("ws").WebSocket,
  request: import("http").IncomingMessage,
  server: import("ws").WebSocketServer
) {
  const cookies = request.headers.cookie;

  const sessionId = cookies
    ?.split(';')
    .find(c => c.trim().startsWith('polarlearn.session-id='))
    ?.split('=')[1];

  let user = null;
  if (sessionId) {
    try {
      user = await getUserFromSession(sessionId);
    } catch (error) {
      console.error("Failed to get user from session:", error);
    }
  }

  // Store user info on the client for later use
  (client as any).user = user;

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