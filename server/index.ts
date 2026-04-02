import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

// Security headers — relax CSP in development for Vite inline scripts
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
}));

// CORS — restrict to known origins
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5000",
  credentials: true,
}));

// Rate limiting — stricter on auth endpoints
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/auth/refresh", authLimiter);

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api/", apiLimiter);

// Prevent Vercel CDN from caching API responses
app.use("/api", (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// Request logging — path, status, duration only (no body/tokens)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      const line = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      console.log(line.length > 120 ? line.slice(0, 119) + "…" : line);
    }
  });
  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler — never leak internals
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    console.error("Unhandled error:", err);
    res.status(status).json({ message: status >= 500 ? "Internal Server Error" : (err.message || "Error") });
  });

  // In development, proxy non-API requests to Vite dev server
  if (process.env.NODE_ENV !== "production") {
    app.use(createProxyMiddleware({
      target: "http://localhost:5173",
      changeOrigin: true,
      ws: true,
    }));
  } else {
    // In production, serve static Vite build
    const path = require("path");
    const frontendPath = path.join(__dirname, "../dist/public");
    app.use(express.static(frontendPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(frontendPath, "index.html"));
    });
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
})();
