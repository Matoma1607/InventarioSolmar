import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Starting server initialization...");

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // API Route for Gemini Assistant
  app.post("/api/assistant", async (req, res) => {
    console.log("POST /api/assistant received");
    const { query, items, units, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      console.warn("WARNING: No Gemini API Key. Using simplified response.");
      
      const q = query?.toLowerCase() || "";
      let response = "No hay una clave de API configurada para usar la IA. ";
      
      if (q.includes("cuántos") || q.includes("total")) {
        response += `Actualmente hay un total de ${units?.length || 0} unidades físicas distribuidas en ${items?.length || 0} categorías.`;
      } else if (q.includes("estado") || q.includes("operativo")) {
        const operativos = units?.filter((u: any) => u.estado === 'Operativo').length || 0;
        response += `Hay ${operativos} unidades en estado Operativo y ${(units?.length || 0) - operativos} en otros estados.`;
      } else {
        response += "Configura GEMINI_API_KEY para habilitar funciones avanzadas.";
      }
      
      return res.json({ text: response });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `
          Eres un asistente de gestión de activos IT para InventarioSolmar.
          Información actual del inventario:
          - Artículos: ${items?.length}
          - Unidades: ${units?.length}
          - Operativas: ${units?.filter((u: any) => u.estado === 'Operativo').length}
          - Reparación: ${units?.filter((u: any) => u.estado === 'En reparación').length}
          
          Últimos eventos:
          ${history?.slice(0, 5).map((h: any) => `- ${h.item_nombre}: ${h.detalle}`).join('\n')}

          Responde técnico y breve.
        `
      });

      const result = await model.generateContent(query);
      const responseText = result.response.text();
      res.json({ text: responseText || "No pude generar respuesta." });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Error al procesar la IA." });
    }
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

