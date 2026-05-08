import { GoogleGenAI } from "@google/genai";
import { Item, Unit, HistoryEntry } from "../types";

export const inventoryAssistant = async (
  query: string, 
  items: Item[], 
  units: Unit[], 
  history: HistoryEntry[]
) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    return "El Asistente IA no está disponible porque no se ha configurado el GEMINI_API_KEY. Por favor, añádelo en los Secretos de AI Studio.";
  }

  const systemInstruction = `
    Eres un asistente de gestión de activos IT para InventarioSolmar.
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
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction
      }
    });
    
    return response.text || "No pude generar una respuesta clara.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lo siento, hubo un error al procesar tu consulta con la IA. Verifica que el API Key sea válido y tengas cuota disponible.";
  }
};
