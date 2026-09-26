import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import basicAuth from "express-basic-auth";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "../shared/constants.js";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export function isLoopbackHost(host: string): boolean {
  const bare = host.replace(/^\[|\]$/g, "");
  return LOOPBACK_HOSTS.has(host) || LOOPBACK_HOSTS.has(bare);
}

export function assertBindAllowed(host: string): void {
  if (isLoopbackHost(host)) return;
  const user = process.env.QMD_GUI_USER;
  const pass = process.env.QMD_GUI_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "Refusing to bind to a non-loopback host without QMD_GUI_USER and QMD_GUI_PASSWORD",
    );
  }
}

export function createHelmetMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
  });
}

export function createRateLimitMiddleware() {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export function createHostGuard(bindHost: string, port: number): RequestHandler {
  const portStr = String(port);
  const allowed = new Set([
    `127.0.0.1:${portStr}`,
    `localhost:${portStr}`,
    `[::1]:${portStr}`,
  ]);
  if (!isLoopbackHost(bindHost)) {
    allowed.add(`${bindHost}:${portStr}`);
  }

  return (req, res, next) => {
    const hostHeader = req.headers.host ?? "";
    if (!allowed.has(hostHeader)) {
      res.status(403).json({ error: "Invalid Host header" });
      return;
    }
    next();
  };
}

export function createBasicAuthIfConfigured(): RequestHandler | null {
  const user = process.env.QMD_GUI_USER;
  const pass = process.env.QMD_GUI_PASSWORD;
  if (!user || !pass) return null;
  return basicAuth({ users: { [user]: pass }, challenge: true });
}
