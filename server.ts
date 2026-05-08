import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Assistant
  app.post("/api/assistant", async (req, res) => {
    const { query, items, units, history } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured on the server." 
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
        model: "gemini-3-flash-preview",
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
      server: { middlewareMode: true },
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
