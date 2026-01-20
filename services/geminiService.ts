import { GoogleGenAI, Chat, Modality, LiveServerMessage, Type } from "@google/genai";

// Luôn khởi tạo với process.env.API_KEY
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Hàm hỗ trợ giải mã base64 (sử dụng thủ công theo hướng dẫn)
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- CHAT & TEXT & VISION ---

export const createChatSession = (options: { enableThinking?: boolean, enableSearch?: boolean } = {}): Chat => {
  const ai = getAI();
  const model = (options.enableThinking || options.enableSearch) ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: `Bạn tên là Huy Long. Bạn là một gia sư AI thông minh, nhiệt tình.
    Phong cách: Thân thiện, ngắn gọn, chuẩn xác. Luôn xưng hô là "mình" và "bạn".`,
  };

  if (options.enableThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  if (options.enableSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  return ai.chats.create({
    model: model,
    config: config,
  });
};

export const sendMessageToGemini = async (
  chat: Chat, 
  message: string, 
  attachment?: { data: string; mimeType: string }
): Promise<{ text: string; grounding?: any }> => {
  try {
    let response;
    if (attachment) {
      response = await chat.sendMessage({
        message: [
          { text: message || "Phân tích hình ảnh này giúp mình." },
          { inlineData: { mimeType: attachment.mimeType, data: attachment.data } }
        ]
      });
    } else {
      response = await chat.sendMessage({ message });
    }
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return { 
        text: response.text || "Huy Long đang suy nghĩ...",
        grounding: groundingChunks
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Có lỗi xảy ra khi kết nối với Huy Long. Vui lòng thử lại!" };
  }
};

// --- AUDIO & SPEECH ---

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  const ai = getAI();
  
  // Clean text: Loại bỏ ký tự markdown và ký tự đặc biệt có thể gây lỗi 500 cho API TTS
  const cleanText = text
    .replace(/[*#_~`\[\]()]/g, '') // Xóa ký tự định dạng markdown
    .replace(/[^\w\s\d\p{L}\p{P}]/gu, '') // Chỉ giữ lại chữ cái, số, dấu câu
    .substring(0, 500) // Giới hạn độ dài để ổn định hơn
    .trim();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("API không trả về dữ liệu âm thanh.");
    
    return decodeBase64(base64Audio);
  } catch (err) {
    console.error("Generate Speech Error Details:", err);
    throw err;
  }
};

export const transcribeAudio = async (base64Data: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: "Hãy chuyển âm thanh này thành văn bản chính xác nhất có thể." }
                ]
            }
        });
        return response.text || "";
    } catch (err) {
        console.error("Transcription error", err);
        return "";
    }
};

// --- FLASHCARDS ---

export const generateFlashcardsFromText = async (text: string): Promise<{ front: string; back: string }[]> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tạo danh sách các thẻ ghi nhớ (flashcards) từ nội dung sau đây. Mỗi thẻ gồm mặt trước là câu hỏi và mặt sau là câu trả lời ngắn gọn: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: {
                type: Type.STRING,
                description: 'Câu hỏi hoặc thuật ngữ ở mặt trước thẻ.',
              },
              back: {
                type: Type.STRING,
                description: 'Câu trả lời hoặc định nghĩa ở mặt sau thẻ.',
              },
            },
            required: ["front", "back"],
          },
        },
      },
    });

    const jsonStr = response.text?.trim();
    if (jsonStr) {
      try {
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Error parsing flashcard JSON", parseError);
        return [];
      }
    }
    return [];
  } catch (err) {
    console.error("Flashcard generation error", err);
    return [];
  }
};

// --- LIVE SESSION ---

export const connectLiveSession = async (callbacks: {
    onOpen?: () => void,
    onMessage?: (message: LiveServerMessage) => void,
    onError?: (error: any) => void,
    onClose?: () => void
}) => {
    const ai = getAI();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
            onopen: callbacks.onOpen || (() => {}),
            onmessage: callbacks.onMessage || (() => {}),
            onerror: callbacks.onError || (() => {}),
            onclose: callbacks.onClose || (() => {}),
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: "Bạn tên là Huy Long, gia sư AI đang trò chuyện trực tiếp. Hãy trả lời ngắn gọn, tự nhiên.",
        },
    });
};

export const createPcmBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encodeBase64(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
};
