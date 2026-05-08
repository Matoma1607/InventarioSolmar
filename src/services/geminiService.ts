import { GoogleGenAI } from "@google/genai";
import { Item, Unit, HistoryEntry } from "../types";

let genAIClient: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

export const inventoryAssistant = async (
  query: string, 
  items: Item[], 
  units: Unit[], 
  history: HistoryEntry[]
) => {
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
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Using a more common model alias to be safe, though gemini-3-flash-preview should work if supported
      contents: query,
      config: {
        systemInstruction
      }
    });
    
    return response.text || "No pude generar una respuesta clara.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lo siento, hubo un error al procesar tu consulta con la IA. Verifica que el API Key esté configurado.";
  }
};
