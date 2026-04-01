import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";

const app = express();

app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || "https://wotigot.vercel.app")
  .split(",")
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin requests (no origin header) and allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/auth/refresh", authLimiter);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api/", apiLimiter);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

let isReady = false;
let initError: Error | null = null;

const readyPromise = (async () => {
  try {
    await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      console.error("Unhandled error:", err);
      res.status(status).json({ message: status >= 500 ? "Internal Server Error" : (err.message || "Error") });
    });

    isReady = true;
  } catch (err: any) {
    console.error("INIT ERROR:", err);
    initError = err;
  }
})();

export default async function handler(req: any, res: any) {
  if (!isReady) await readyPromise;
  if (initError) return res.status(500).json({ error: "Server initialization failed" });
  return app(req, res);
}
