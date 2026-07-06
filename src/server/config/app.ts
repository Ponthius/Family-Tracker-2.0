import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { sessionMiddleware } from "./session.js";
import { router } from "../routes/index.js";
import { errorHandler } from "../utils/errors.js";

const __dirname = path.resolve();
export const app = express();

// Parse JSON bodies from API requests
app.use(express.json());

// Parse form submissions
app.use(express.urlencoded({ extended: true }));

// Enable session-based authentication via cookies
app.use(sessionMiddleware);

// Serve compiled HTML, CSS, and JS from the public/ folder
app.use(express.static(path.join(__dirname, "../../../public")));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "../../../public/index.html"));
});

// --- NEW: Global Back Button Injection Middleware ---
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function (body: any) {
        if (typeof body === 'string') {
            // Injects the script before the closing body tag
            body = body.replace('</body>', '<script type="module" src="/client/app-init.js"></script></body>');
        }
        return originalSend.call(this, body);
    };
    next();
});

// All API routes live under /api
app.use("/api", router);

// Redirect the root URL to the login page
app.get("/", (_req, res) => res.redirect("/pages/login.html"));

// Global error handler — must be registered last, after all routes
app.use(errorHandler);
