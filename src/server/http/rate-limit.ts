import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RateLimitOptions = { limit: number; windowMs: number };

function clientAddress(request: Request) {
  // Reverse proxies append the address they observed. Use the last hop so a
  // caller cannot evade the quota by prepending a forged X-Forwarded-For value.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
  const lastHop = forwarded?.at(-1);
  if (lastHop) return lastHop;
  const host = new URL(request.url).host;
  return `no-proxy-ip:${host}`;
}

function identifierFor(request: Request, scope: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET requis pour limiter les requêtes.");
  return createHmac("sha256", secret).update(`${scope}:${clientAddress(request)}`).digest("hex");
}

export async function enforceRateLimit(request: Request, scope: string, options: RateLimitOptions) {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / options.windowMs) * options.windowMs);
  const identifier = identifierFor(request, scope);
  const bucket = await prisma.apiRateLimit.upsert({
    where: { identifier_windowStart: { identifier, windowStart } },
    create: { identifier, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  // Opportunistic retention keeps the table bounded without a separate worker.
  if (Math.random() < 0.01) {
    void prisma.apiRateLimit.deleteMany({ where: { windowStart: { lt: new Date(now - 24 * 60 * 60 * 1000) } } }).catch(() => {});
  }

  if (bucket.count <= options.limit) return null;
  const retryAfter = Math.max(1, Math.ceil((windowStart.getTime() + options.windowMs - now) / 1000));
  return NextResponse.json(
    { error: "Trop de requêtes. Réessayez dans quelques instants." },
    { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } },
  );
}
