import { GoogleGenAI } from "@google/genai";
import { Item, Unit, HistoryEntry } from "../types";

export const inventoryAssistant = async (
  query: string, 
  items: Item[], 
  units: Unit[], 
  history: HistoryEntry[]
) => {
  try {
    const response = await fetch("/api/assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, items, units, history }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.error?.includes("clave de API")) {
        return "El Asistente IA no está disponible porque no se ha configurado la clave en el servidor. Por favor, añade GEMINI_API_KEY o GOOGLE_API_KEY en los Secretos de AI Studio.";
      }
      throw new Error("Server error");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lo siento, hubo un error al conectar con el asistente de IA. Verifica tu conexión.";
  }
};
