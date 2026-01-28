import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import healthRoutes from "./routes/health.routes.js";
import pasteRoutes from "./routes/paste.routes.js";
import { getPasteHtml } from "./controllers/paste.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.json({ limit: "256kb" }));

// Serve static files from public directory (for frontend)
app.use(express.static(join(__dirname, "../public")));

// HTML view route for pastes (must be before API routes to avoid conflicts)
app.get("/p/:id", getPasteHtml);

app.use("/api/healthz", healthRoutes);
app.use("/api/pastes", pasteRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ error: { message: "Not found" } });
});

export default app;
