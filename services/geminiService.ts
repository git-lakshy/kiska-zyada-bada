
import { GoogleGenAI } from "@google/genai";

export async function getGameCommentary(
  turn: number,
  p1Score: number,
  p2Score: number,
  p1Weight: number,
  p2Weight: number,
  p1Name: string,
  p2Name: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
    You are a professional high-stakes game commentator. 
    Current Turn: ${turn}
    ${p1Name} Score: ${p1Score.toFixed(2)} (Weight: ${p1Weight.toFixed(2)})
    ${p2Name} Score: ${p2Score.toFixed(2)} (Weight: ${p2Weight.toFixed(2)})
    
    Give a very brief, hype-filled 1-sentence commentary on who is winning or the strategy being used.
    Use the players' actual names: ${p1Name} and ${p2Name}.
    If the game just finished, announce the winner with dramatic flair.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 60,
        temperature: 0.9,
      }
    });
    return response.text || "The battle intensifies!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The crowd gasps as the numbers fluctuate!";
  }
}
