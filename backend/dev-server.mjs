// dev-server.mjs — Local development server.
// Wraps the Lambda handler in Express so you can test without deploying to AWS.
// Usage: node dev-server.mjs
//
// This file is NOT deployed to Lambda. It is for local testing only.

import express from "express";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Set environment variables BEFORE importing the handler ---
// These simulate what Lambda environment variables provide.

const DATA_DIR = join(__dirname, ".local-data");
await mkdir(DATA_DIR, { recursive: true });

process.env.LOCAL_DATA_DIR = DATA_DIR;
process.env.TOKEN_SECRET = process.env.TOKEN_SECRET || "lost-found-local-dev-secret-key-2026";
process.env.ADMIN_KEY = process.env.ADMIN_KEY || "dev-admin-key";
// Optional: process.env.ALLOWED_EMAIL_DOMAIN = "college.edu";

// Now import the handler (it reads env vars at import time)
const { handler } = await import("./index.mjs");

// --- Express app ---

const app = express();
const PORT = 3000;

// CORS for the Vite dev server
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-key");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// Local photo upload endpoint (saves file directly to .local-data)
app.put("/{*path}", (req, res, next) => {
  if (req.path.startsWith("/_upload/")) {
    return express.raw({ type: "*/*", limit: "10mb" })(req, res, async () => {
      try {
        const relPath = req.path.replace(/^\/_upload\//, "");
        const targetFile = join(DATA_DIR, relPath);
        await mkdir(dirname(targetFile), { recursive: true });
        await writeFile(targetFile, req.body);
        return res.status(200).send("OK");
      } catch (err) {
        console.error("Local photo upload error:", err);
        return res.status(500).json({ error: "Failed to save photo locally." });
      }
    });
  }
  next();
});

// Local photo serving endpoint
app.get("/{*path}", async (req, res, next) => {
  if (req.path.startsWith("/_photo/")) {
    const relPath = req.path.replace(/^\/_photo\//, "");
    const targetFile = join(DATA_DIR, relPath);
    try {
      const buffer = await readFile(targetFile);
      const ext = extname(targetFile).toLowerCase();
      const mimeTypes = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
      };
      res.setHeader("Content-Type", mimeTypes[ext] || "image/jpeg");
      return res.status(200).send(buffer);
    } catch (err) {
      if (err.code === "ENOENT") {
        return res.status(404).json({ error: "Photo not found." });
      }
      console.error("Local photo read error:", err);
      return res.status(500).json({ error: "Error reading photo." });
    }
  }
  next();
});

// Parse raw body for the Lambda handler
app.use(express.text({ type: "*/*", limit: "1mb" }));

// Translate every request into a Lambda Function URL v2 event
app.all("/{*path}", async (req, res) => {
  try {
    const event = {
      requestContext: {
        http: {
          method: req.method,
          path: req.path,
        },
      },
      rawPath: req.path,
      queryStringParameters: Object.keys(req.query).length ? req.query : undefined,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization || "",
      },
      body: typeof req.body === "string" && req.body.length > 0 ? req.body : undefined,
      isBase64Encoded: false,
    };

    const result = await handler(event);

    // Set response headers from Lambda result
    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        res.setHeader(key, value);
      }
    }

    res.status(result.statusCode).send(result.body);
  } catch (err) {
    console.error("Dev server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log("");
  console.log("  🚀 Lost & Found dev server running at http://localhost:" + PORT);
  console.log("  📁 Data stored in: " + DATA_DIR);
  console.log("  🔑 Admin key: " + process.env.ADMIN_KEY);
  console.log("");
  console.log("  Start the frontend with: cd frontend && npm run dev");
  console.log("");
});
