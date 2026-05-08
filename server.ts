import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Importar plugins de Vite para usarlos inline
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Assistant
  app.post("/api/assistant", async (req, res) => {
    console.log("API: Assistant request received");
    const { query, items, units, history } = req.body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "No se encontró una clave de API configurada. Por favor, configura GEMINI_API_KEY en tu archivo .env local." 
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `
        Eres un asistente de gestión de activos IT para InventarioSolmar.
        Información actual del inventario:
        - Artículos únicos: ${items.length}
        - Unidades físicas totales: ${units.length}
        - Unidades operativas: ${units.filter((u: any) => u.estado === 'Operativo').length}
        - Unidades en reparación: ${units.filter((u: any) => u.estado === 'En reparación').length}
        
        Últimos 5 eventos de historial:
        ${history.slice(0, 5).map((h: any) => `- ${h.ts}: ${h.tipo} - ${h.item_nombre} (${h.detalle})`).join('\n')}

        Responde de forma concisa y técnica a la consulta del usuario.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: query,
        config: {
          systemInstruction
        }
      });
      
      res.json({ text: response.text || "No pude generar una respuesta." });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Error al procesar la solicitud con Gemini." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configFile: false, // Desactivar la carga de vite.config.ts
      root: process.cwd(),
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          "@": path.resolve(process.cwd(), "./src"),
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\x1b[32m✔ Servidor ejecutándose en http://localhost:${PORT}\x1b[0m`);
  });
}

startServer();
