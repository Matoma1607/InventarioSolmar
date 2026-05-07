import { GoogleGenerativeAI } from "@google/generative-ai";
import { Item, Unit, HistoryEntry } from "../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const inventoryAssistant = async (
  query: string, 
  items: Item[], 
  units: Unit[], 
  history: HistoryEntry[]
) => {
  const context = `
    Eres un asistente de gestión de activos IT para Óptica Solmar.
    Información actual del inventario:
    - Artículos únicos: ${items.length}
    - Unidades físicas totales: ${units.length}
    - Unidades operativas: ${units.filter(u => u.estado === 'Operativo').length}
    - Unidades en reparación: ${units.filter(u => u.estado === 'En reparación').length}
    
    Resumen de artículos por sucursal:
    ${Object.entries(
      items.reduce((acc: any, item) => {
        acc[item.sucursal] = (acc[item.sucursal] || 0) + item.cantidad;
        return acc;
      }, {})
    ).map(([suc, count]) => `- ${suc}: ${count} unidades`).join('\n')}

    Últimos 5 eventos de historial:
    ${history.slice(0, 5).map(h => `- ${h.ts}: ${h.tipo} - ${h.item_nombre} (${h.detalle})`).join('\n')}

    Responde de forma concisa y técnica a la consulta del usuario sobre el estado del inventario o recomendaciones.
  `;

  try {
    const result = await model.generateContent([context, query]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lo siento, hubo un error al procesar tu consulta con la IA.";
  }
};
