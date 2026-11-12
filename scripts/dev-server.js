/**
 * Zero-dependency static dev server for MORNING.
 * Usage: npm run dev   (optional: PORT=8080 npm run dev)
 */
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const START_PORT = Number(process.env.PORT) || 5173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".md": "text/plain; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (urlPath.endsWith("/")) urlPath += "index.html";

    const filePath = path.join(ROOT, urlPath);
    // Never serve anything outside the project folder
    if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    // "/menu" → "/menu/" so relative links inside the page resolve correctly
    const stat = await fs.stat(filePath).catch(() => null);
    if (stat && stat.isDirectory()) {
      res.writeHead(301, { Location: urlPath + "/" }).end();
      return;
    }

    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404 — Not found");
  }
});

function listen(port) {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE" && port < START_PORT + 20) {
      listen(port + 1); // port busy → try the next one
    } else {
      console.error(err);
      process.exit(1);
    }
  });
  server.listen(port, "0.0.0.0", () => {
    // List every LAN address; virtual adapters (VirtualBox, WSL, Hyper-V) also show up,
    // so open the one that matches your Wi-Fi network on your phone.
    const lan = Object.values(os.networkInterfaces())
      .flat()
      .filter((i) => i && i.family === "IPv4" && !i.internal)
      .map((i) => i.address);
    console.log("\n  MORNING. dev server running\n");
    console.log(`  Local:    http://localhost:${port}/`);
    lan.forEach((ip) => console.log(`  Network:  http://${ip}:${port}/`));
    if (lan.length) console.log("            (open the Network link on a phone on the same Wi-Fi)");
    console.log("\n  Press Ctrl+C to stop.\n");
  });
}

listen(START_PORT);
