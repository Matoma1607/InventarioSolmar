import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
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

  // API Route for Local Inventory Assistant (No AI)
  app.post("/api/assistant", async (req, res) => {
    console.log("--> RECIBIDA PETICIÓN EN /api/assistant");
    try {
      const { query, items = [], units = [], history = [] } = req.body;
      
      if (!query) {
        return res.json({ text: "No recibí ninguna consulta." });
      }

      // Normalizar texto (quitar tildes, minúsculas)
      const normalize = (text: string) => 
        String(text)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

      const q = normalize(query);
      console.log("Query normalizada:", q);

      let response = "";

      // 1. Comando de ayuda
      if (q.includes("ayuda") || q.includes("que puedes hacer") || q.includes("que haces")) {
        response = "Soy tu asistente local de InventarioSolmar. Puedo darte el stock total, estados de equipos (operativos/reparación), buscar artículos específicos y ver el historial reciente.";
      }
      // 2. Stock total
      else if (q.includes("cuantos") || q.includes("total") || q.includes("resumen") || q.includes("stock")) {
        const operativos = units.filter((u: any) => u.estado === 'Operativo').length;
        const reparacion = units.filter((u: any) => u.estado === 'En reparación').length;
        response = `Hay un total de ${units.length} unidades registradas (${items.length} tipos de artículos). Estado: ${operativos} operativos y ${reparacion} en reparación.`;
      }
      // 3. Consulta por nombre de artículo
      else {
        const itemMentioned = items.find((it: any) => q.includes(normalize(it.nombre)));
        
        if (itemMentioned) {
          const itemUnits = units.filter((u: any) => u.itemId === itemMentioned.id);
          const operativos = itemUnits.filter((u: any) => u.estado === 'Operativo').length;
          const reparacion = itemUnits.filter((u: any) => u.estado === 'En reparación').length;
          
          response = `Artículo: ${itemMentioned.nombre}. Stock total: ${itemUnits.length}. Estado: ${operativos} operativos, ${reparacion} en reparación.`;
          
          if (q.includes("donde") || q.includes("ubicacion")) {
            const locs = [...new Set(itemUnits.map((u: any) => u.ubicacion))].filter(Boolean);
            response += locs.length > 0 ? ` Ubicaciones: ${locs.join(", ")}.` : " No se especificó ubicación.";
          }
        } 
        // 4. Estados generales
        else if (q.includes("operativo") || q.includes("funcionan")) {
          const list = units.filter((u: any) => u.estado === 'Operativo');
          response = `Tenemos ${list.length} unidades operativas actualmente.`;
        }
        else if (q.includes("reparacion") || q.includes("roto") || q.includes("arreglo")) {
          const list = units.filter((u: any) => u.estado === 'En reparación');
          response = list.length > 0 
            ? `Hay ${list.length} unidades en reparación.`
            : "No hay ninguna unidad marcada 'En reparación' actualmente.";
        }
        // 5. Historial
        else if (q.includes("historial") || q.includes("paso") || q.includes("ultimo")) {
          if (history.length > 0) {
            const last = history[0];
            response = `Último movimiento (${last.ts}): ${last.tipo} de ${last.item_nombre}. Detalle: ${last.detalle}.`;
          } else {
            response = "El historial está vacío actualmente.";
          }
        }
        else {
          response = "No reconozco esa consulta. Intenta con: '¿Cuántos hay?', '¿Qué hay roto?' o el nombre de un artículo como 'Laptops'.";
        }
      }

      console.log("Respuesta generada:", response);
      res.json({ text: response });
    } catch (err) {
      console.error("Error en el asistente local:", err);
      res.status(500).json({ error: "Error interno procesando la consulta." });
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

