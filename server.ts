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
    const { query, items = [], units = [], history = [] } = req.body;
    
    // Normalizar texto (quitar tildes, minúsculas)
    const normalize = (text: string) => 
      text.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();

    const q = normalize(query || "");
    let response = "";

    // 1. Ayuda / Comandos generales
    if (q.includes("ayuda") || q.includes("que puedes hacer")) {
      response = "Puedo informarte sobre el stock total, el estado de las unidades (operativas/reparación), detalles por artículo específico y últimos movimientos del historial.";
    }
    // 2. Resumen total
    else if (q.includes("total") || q.includes("cuantos hay") || q.includes("resumen")) {
      const operativos = units.filter((u: any) => u.estado === 'Operativo').length;
      const reparacion = units.filter((u: any) => u.estado === 'En reparación').length;
      response = `Actualmente hay ${units.length} unidades físicas en total, distribuidas en ${items.length} categorías. Tenemos ${operativos} operativas y ${reparacion} en reparación.`;
    }
    // 3. Consulta de artículos específicos
    else {
      // Intentar encontrar si menciona algún artículo
      const itemMentioned = items.find((it: any) => q.includes(normalize(it.nombre)));
      
      if (itemMentioned) {
        const itemUnits = units.filter((u: any) => u.itemId === itemMentioned.id);
        const operativos = itemUnits.filter((u: any) => u.estado === 'Operativo').length;
        const reparacion = itemUnits.filter((u: any) => u.estado === 'En reparación').length;
        
        response = `Para "${itemMentioned.nombre}": Hay un total de ${itemUnits.length} unidades. Estado: ${operativos} operativas y ${reparacion} en reparación.`;
        
        if (q.includes("donde") || q.includes("ubicacion")) {
          const sub = itemUnits.length > 0 ? `Se encuentran en: ${[...new Set(itemUnits.map((u:any) => u.ubicacion))].join(", ")}` : "";
          response += ` ${sub}`;
        }
      } 
      // 4. Consulta de estados generales
      else if (q.includes("operativo") || q.includes("funcionan")) {
        const list = units.filter((u: any) => u.estado === 'Operativo');
        response = `Hay ${list.length} unidades operativas en total.`;
      }
      else if (q.includes("reparacion") || q.includes("roto") || q.includes("arreglo")) {
        const list = units.filter((u: any) => u.estado === 'En reparación');
        response = list.length > 0 
          ? `Hay ${list.length} unidades en reparación. Principalmente: ${[...new Set(list.map((u:any) => u.item_nombre))].join(", ")}.`
          : "¡Buenas noticias! No hay ninguna unidad registrada en reparación actualmente.";
      }
      // 5. Historial / Cambios
      else if (q.includes("historial") || q.includes("paso") || q.includes("ultimo")) {
        if (history.length > 0) {
          const last = history[0];
          response = `El último movimiento registrado fue el ${last.ts}: ${last.tipo} de ${last.item_nombre} (${last.detalle}).`;
        } else {
          response = "No hay registros de movimientos recientes en el historial.";
        }
      }
      // 6. No se entendió
      else {
        response = "No logré identificar qué artículo o dato buscas. Prueba preguntando '¿Cuántos laptops hay?' o '¿Qué hay en reparación?'.";
      }
    }

    res.json({ text: response });
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

