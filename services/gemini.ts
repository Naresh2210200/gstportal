
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Use Vite-compatible env variable instead of process.env (Node.js only)
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

// AI function to validate financial file data consistency and formats
export async function validateFileData(fileName: string, contentSnippet: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Validate this mock data snippet for a financial file named "${fileName}". 
      Snippet: ${contentSnippet}
      
      Analyze if it looks like a valid financial record (Target format). 
      Identify possible errors like missing columns, date format issues, or tax mismatches.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            errors: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            suggestedCorrections: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["isValid", "errors", "summary"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Validation Error:", error);
    return { isValid: false, errors: ["AI processing failed"], summary: "Error communicating with Gemini." };
  }
}

// AI function to simulate transformation rules for standard formats
export async function convertToSpeqtaFormat(fileName: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Simulate a transformation of file "${fileName}" from 'Target' format to 'Speqta' format. 
      List the mapping rules that would be applied (e.g., column renames, date format conversion from DD/MM/YYYY to YYYY-MM-DD).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mappingRules: { type: Type.ARRAY, items: { type: Type.STRING } },
            conversionSuccess: { type: Type.BOOLEAN },
            processedFileName: { type: Type.STRING }
          },
          required: ["mappingRules", "conversionSuccess"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Conversion Error:", error);
    return { conversionSuccess: false, mappingRules: ["Conversion aborted"] };
  }
}

/**
 * Uses Gemini to intelligently map custom client file headers to standard GSTR1 field names.
 */
export async function getAIGSTRMapping(fileName: string, headers: string[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Map these client file headers to standard GSTR1 headers for the file "${fileName}".
      Headers: ${headers.join(", ")}
      
      Identify which standard GSTR1 column each client header belongs to (e.g., GSTIN/UIN, Invoice No, Taxable Value, etc.).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mapping: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  clientHeader: { type: Type.STRING },
                  standardHeader: { type: Type.STRING }
                },
                required: ["clientHeader", "standardHeader"]
              }
            }
          },
          required: ["mapping"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Mapping Error:", error);
    return { mapping: [] };
  }
}
