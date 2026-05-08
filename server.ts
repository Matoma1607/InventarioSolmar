import express from "express";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// En Node 20.11+ / 22, import.meta.dirname ya está disponible
const __dirname = import.meta.dirname;
const root = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini Assistant
  app.post("/api/assistant", async (req, res) => {
    const { query, items, units, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY;

    // Si no hay API Key, respondemos con una lógica simple "offline" (sin IA)
    if (!apiKey) {
      console.warn("ADVERTENCIA: No hay API Key de Gemini. Usando respuesta simplificada.");
      
      const q = query.toLowerCase();
      let response = "No hay una clave de API configurada para usar la IA. ";
      
      if (q.includes("cuántos") || q.includes("total")) {
        response += `Actualmente hay un total de ${units.length} unidades físicas distribuidas en ${items.length} categorías de artículos.`;
      } else if (q.includes("estado") || q.includes("operativo")) {
        const operativos = units.filter((u: any) => u.estado === 'Operativo').length;
        response += `Hay ${operativos} unidades en estado Operativo y ${units.length - operativos} que requieren atención o están en reparación.`;
      } else {
        response += "Puedes consultar sobre totales o estados del inventario. Para análisis avanzados, configura GEMINI_API_KEY.";
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
          - Artículos únicos: ${items?.length}
          - Unidades físicas totales: ${units?.length}
          - Unidades operativas: ${units?.filter((u: any) => u.estado === 'Operativo').length}
          - Unidades en reparación: ${units?.filter((u: any) => u.estado === 'En reparación').length}
          
          Últimos 5 eventos de historial:
          ${history?.slice(0, 5).map((h: any) => `- ${h.ts}: ${h.tipo} - ${h.item_nombre} (${h.detalle})`).join('\n')}

          Responde de forma concisa y técnica. Si no sabes algo, dilo.
        `
      });

      const result = await model.generateContent(query);
      const responseText = result.response.text();
      res.json({ text: responseText || "No pude generar una respuesta." });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Error al procesar la IA." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    // Usamos imports dinámicos dentro de la función para mayor compatibilidad
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
    const distPath = path.join(root, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\x1b[32m✔ Servidor ejecutándose en http://0.0.0.0:${PORT}\x1b[0m`);
  });
}

startServer().catch(err => {
  console.error("Critical server error:", err);
  process.exit(1);
});
