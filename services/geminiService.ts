
import { GoogleGenAI, Chat, Modality, LiveServerMessage, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  // Xử lý chuỗi 'undefined' mà Netlify/Vite thỉnh thoảng truyền vào khi biến chưa set
  if (!apiKey || apiKey === 'undefined' || apiKey === '' || apiKey === 'null') {
    console.warn("Gemini API Key is missing. Please check your environment variables in Netlify/Local.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

function decodeBase64(base64: string) {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error("Base64 decode error", e);
    return new ArrayBuffer(0);
  }
}

export const createChatSession = (options: { enableThinking?: boolean, enableSearch?: boolean } = {}): Chat | null => {
  try {
    const ai = getAI();
    if (!ai) return null;
    const model = (options.enableThinking || options.enableSearch) ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    const config: any = {
      systemInstruction: `Bạn tên là Huy Long. Bạn là một gia sư AI thông minh, nhiệt tình. Phong cách: Thân thiện, ngắn gọn.`,
    };

    if (options.enableThinking) config.thinkingConfig = { thinkingBudget: 32768 };
    if (options.enableSearch) config.tools = [{ googleSearch: {} }];

    return ai.chats.create({ model, config });
  } catch (e) {
    console.error("Failed to create chat", e);
    return null;
  }
};

export const sendMessageToGemini = async (
  chat: Chat, 
  message: string, 
  attachment?: { data: string; mimeType: string }
): Promise<{ text: string; grounding?: any }> => {
  if (!chat) return { text: "API Key chưa được cấu hình đúng trên Netlify (Site Settings -> Env Vars). Vui lòng kiểm tra lại!" };
  
  try {
    let response;
    if (attachment) {
      response = await chat.sendMessage({
        message: [
          { text: message || "Phân tích hình ảnh." },
          { inlineData: { mimeType: attachment.mimeType, data: attachment.data } }
        ]
      });
    } else {
      response = await chat.sendMessage({ message });
    }
    
    return { 
        text: response.text || "Huy Long đang suy nghĩ...",
        grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error: any) {
    const msg = error.message || "";
    if (msg.includes('API_KEY_INVALID') || msg.includes('403')) {
        return { text: "API Key không hợp lệ hoặc không có quyền truy cập. Hãy kiểm tra lại cấu hình biến môi trường trên Netlify." };
    }
    return { text: "Lỗi kết nối AI. Thử lại sau!" };
  }
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  const ai = getAI();
  if (!ai) throw new Error("API Key missing");
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text.substring(0, 500) }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!data) throw new Error("No audio data");
  return decodeBase64(data);
};

export const transcribeAudio = async (base64Data: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    if (!ai) return "";
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: "Chuyển thành văn bản." }] }
    });
    return response.text || "";
};

export const generateFlashcardsFromText = async (text: string): Promise<{ front: string; back: string }[]> => {
  const ai = getAI();
  if (!ai) return [];
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Tạo flashcards JSON: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { front: { type: Type.STRING }, back: { type: Type.STRING } },
          required: ["front", "back"],
        },
      },
    },
  });
  return JSON.parse(response.text || "[]");
};

export const connectLiveSession = async (callbacks: any) => {
    const ai = getAI();
    if (!ai) throw new Error("API Key missing");
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
            onopen: callbacks.onOpen,
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: "Bạn là Huy Long.",
        },
    });
};

export const createPcmBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
};
