import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { sessionMiddleware } from "./session.js";
import { router } from "../routes/index.js";
import { errorHandler } from "../utils/errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

// Parse JSON bodies from API requests
app.use(express.json());

// Parse form submissions
app.use(express.urlencoded({ extended: true }));

// Enable session-based authentication via cookies
app.use(sessionMiddleware);

// Serve compiled HTML, CSS, and JS from the public/ folder
app.use(express.static(path.join(__dirname, "../../../public")));

// All API routes live under /api
app.use("/api", router);

// Redirect the root URL to the landing page
app.get("/", (_req, res) => res.redirect("/pages/landing-page.html"));

// Global error handler — must be registered last, after all routes
app.use(errorHandler);
