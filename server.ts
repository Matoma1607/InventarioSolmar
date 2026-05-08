import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import multer from "multer";

const multerFn = (multer as any).default || multer;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Starting server initialization...");

  app.use(express.json());

  // Configure multer for file uploads
  const uploadsDir = path.join(root, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploads directory - Move this up so it's always accessible
  app.use("/uploads", express.static(uploadsDir));

  // Logger middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      cb(null, uploadsDir);
    },
    filename: (req: any, file: any, cb: any) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multerFn({ 
    storage,
    limits: { fileSize: 20 * 1024 * 1024 } 
  });

  app.post("/api/upload", (req: any, res: any) => {
    console.log(`[${new Date().toISOString()}] POST /api/upload - Content-Type: ${req.get('Content-Type')}`);
    
    upload.single("file")(req, res, (err: any) => {
      if (err) {
        console.error("Multer error detail:", err);
        return res.status(500).json({ 
          error: "Error procesando el archivo", 
          details: err.message,
          code: err.code 
        });
      }
      
      const multerReq = req as any;
      if (!multerReq.file) {
        console.error("No file found in request body after multer processing");
        return res.status(400).json({ error: "No se subió ningún archivo o el campo no es 'file'." });
      }

      const fileUrl = `/uploads/${multerReq.file.filename}`;
      console.log(`Upload successful: ${fileUrl} (${multerReq.file.size} bytes)`);
      res.json({ url: fileUrl, filename: multerReq.file.originalname });
    });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      mode: process.env.NODE_ENV || "development",
      time: new Date().toISOString()
    });
  });

  app.get("/api/debug", (req, res) => {
    res.json({
      env: process.env.NODE_ENV,
      root,
      uploadsDir,
      uploadsExist: fs.existsSync(uploadsDir),
      multerType: typeof multerFn
    });
  });

  // Fallback for API routes that don't exist
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite middleware...");
    const react = (await import("@vitejs/plugin-react")).default;
    const tailwindcss = (await import("@tailwindcss/vite")).default;

    const vite = await createViteServer({
      configFile: false,
      root,
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          "@": path.resolve(root, "src"),
        },
      },
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configuring static production serving...");
    const distPath = path.join(root, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\x1b[32m✔ Server running at http://0.0.0.0:${PORT}\x1b[0m`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL SERVER ERROR:", err);
  process.exit(1);
});
