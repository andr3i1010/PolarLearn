import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { Embed, Webhook } from "@vermaysha/discord-webhook";
import { decodeCookie } from "@/utils/auth/session";
import { prisma } from "@/utils/prisma";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip static files and prefetch
  if (
    pathname.startsWith("/_next") ||
    // pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.(css|js|ts|tsx|jsx|woff2?|ttf|png|jpg|jpeg|gif|svg|webmanifest)$/.test(pathname) ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("RSC") === "1" ||
    request.nextUrl.searchParams.has("_rsc")
  ) {
    return NextResponse.next();
  }

  // Bot / scanner detection (before any heavier logic)
  const userAgent = request.headers.get("user-agent") || "";
  if (
    pathname.startsWith('/api/v1') &&
    ["curl", "wget", "httpie", "powershell", "go-http-client"].some((bot) =>
      userAgent.toLowerCase().includes(bot)
    )
  ) {
    const ip = request.headers.get("CF-Connecting-IP")
      ? `${request.headers.get("CF-Connecting-IP")} (CF-Connecting-IP)`
      : request.headers.get("x-forwarded-for")
        ? `${request.headers.get("x-forwarded-for")} (x-forwarded-for)`
        : "Onbekend";
    const embed = new Embed()
      .setTitle("MOGELIJK API MISGEBRUIK GEDETECTEERD!!!!")
      .setDescription("Er is een verzoek naar de API gedaan met een verdachte user-agent.")
      .addField({ name: "IP", value: ip, inline: true })
      .addField({ name: "useragent", value: userAgent, inline: true })
      .addField({ name: "Geprobeerde pad", value: pathname, inline: true })
      .setColor("#ff0000ff")
      .setTimestamp();

    const freshWebhook = new Webhook(process.env.DISCORD_WEBHOOK || "");
    freshWebhook.setUsername("Polarlearn security logs");
    freshWebhook.addEmbed(embed);
    freshWebhook
      .setContent(`@here
\`\`\`
[ Automatische scanrapport ]
Tijd: ${new Date().toLocaleString()}
IP: ${ip}
useragent: ${userAgent}
Geprobeerde pad: ${pathname}

[ Automatisch gegenereerd door PolarLearn ]
\`\`\``)
      .send();

    return new NextResponse(
      "you shall not pass", { status: 403 }
    );
  }

  // Nu we de bots in api/v1 hebben afgehandeld, kunnen we verder gaan met het toestaan van legitieme verzoeken.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Auth gate for protected routes
  const authResponse = await middlewareAuth(request);
  if (authResponse) return authResponse;

  const resp = NextResponse.next();

  resp.headers.set("X-Content-Type-Options", "nosniff");
  resp.headers.set("Access-Control-Allow-Origin", "*");
  resp.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  resp.headers.set("X-Frame-Options", "SAMEORIGIN");
  resp.headers.set("X-XSS-Protection", "1; mode=block");
  resp.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  return resp;
}

async function middlewareAuth(request: NextRequest): Promise<NextResponse | null> {
  const isPrefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("Next-Router-Prefetch") === "1";
  const isRSC =
    request.headers.get("RSC") === "1" ||
    request.nextUrl.searchParams.has("_rsc");
  if (isPrefetch || isRSC || request.headers.has("Next-Url")) {
    return null; // Allow through; main middleware will continue
  }

  const path = request.nextUrl.pathname;
  const isUnauthenticatedAllowed = path === "/" || path === "/home/forum" || path.startsWith("/home/forum/") || path.startsWith("/auth/");

  const sessionCookie = request.cookies.get("polarlearn.session-id");

  // If no session and unauthenticated route, allow through
  if (!sessionCookie?.value && isUnauthenticatedAllowed) return null;

  if (!sessionCookie?.value) {
    const redirect = NextResponse.redirect(new URL("/auth/sign-in", request.url));
    if (!request.headers.get("Next-Router-Prefetch")) {
      redirect.cookies.set("polarlearn.goto", path, {
        path: "/",
        maxAge: 10 * 60,
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }
    return redirect;
  }

  try {
    const sessionId = await decodeCookie(sessionCookie.value);
    if (!sessionId && !request.headers.get("Next-Url")) {
      const redirect = NextResponse.redirect(new URL("/auth/sign-in", request.url));
      if (!request.headers.get("Next-Router-Prefetch")) {
        redirect.cookies.set("polarlearn.goto", path, {
          path: "/",
          maxAge: 10 * 60,
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
      return redirect;
    }

    const session = await prisma.session.findUnique({
      where: { sessionID: sessionId as string },
    });

    if (!session || session.expires < new Date()) {
      const redirect = NextResponse.redirect(new URL("/auth/sign-in", request.url));
      if (!request.headers.get("Next-Router-Prefetch")) {
        redirect.cookies.set("polarlearn.goto", path, {
          path: "/",
          maxAge: 10 * 60,
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
      return redirect;
    }

    // Check if user is banned (check this for ALL routes, even auth routes)
    if (session.userId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { loginAllowed: true },
      });

      if (user && user.loginAllowed === false) {
        // Only allow access to the banned page itself, redirect everything else
        if (path !== "/auth/banned") {
          return NextResponse.redirect(new URL("/auth/banned", request.url));
        }
      }
    }

    // If user has valid session and is on auth route (and not banned), allow through
    if (isUnauthenticatedAllowed) return null;

    return null; // Auth OK
  } catch (error) {
    console.error("Authentication error in middleware:", error);
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }
}

export const config = {
  matcher: ["/:path*"]
};
