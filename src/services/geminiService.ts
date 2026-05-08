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

    console.log("Assistant Response Status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("Assistant Error Text:", text);
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Assistant Data Received:", data);
    return data.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lo siento, hubo un error al conectar con el asistente de IA. Verifica tu conexión.";
  }
};
