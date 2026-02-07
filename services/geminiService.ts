import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Initialize the Gemini Client
// IMPORTANT: process.env.API_KEY is automatically injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-3-flash-preview";

export const analyzeFrame = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // Strip the data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this driver's face for drowsiness monitoring. Focus strictly on the eyes. 
            Classify the state as 'Alert', 'Drowsy', or 'Asleep'.
            Provide a confidence score (0-100) and an estimated eye openness score (0-100, where 100 is fully wide open, 0 is closed).`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              enum: ["Alert", "Drowsy", "Asleep"],
            },
            confidence: {
              type: Type.NUMBER,
            },
            eyeOpenness: {
              type: Type.NUMBER,
            },
          },
          required: ["status", "confidence", "eyeOpenness"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);

    return {
      status: data.status,
      confidence: data.confidence,
      eyeOpenness: data.eyeOpenness,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Gemini Vision Analysis Error:", error);
    // Return a fallback safe state to avoid crashing the loop, but low confidence
    return {
      status: 'Alert',
      confidence: 0,
      eyeOpenness: 50,
      timestamp: Date.now(),
    };
  }
};