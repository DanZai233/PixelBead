
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 生成一张 1:1 的像素艺术图片
 */
export const generatePixelArtImage = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A high-quality 1:1 square pixel art of ${prompt}. The style should be clean, vibrant, suitable for Perler beads (hama beads). Solid white background, clear and bold outlines, limited color palette. Centered subject.`
        }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  // 寻找返回的图像部分
  for (const part of response.candidates?.[0].content.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("AI 未能生成有效的图像部分。");
};
