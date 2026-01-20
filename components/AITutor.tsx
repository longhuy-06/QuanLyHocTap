
import React, { useState, useEffect, useRef } from 'react';
import { Chat, LiveServerMessage } from '@google/genai';
import { createChatSession, sendMessageToGemini, connectLiveSession, createPcmBlob, generateSpeech, transcribeAudio } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useDataStore } from '../lib/store/dataStore';
import { useAuthStore } from '../lib/store/authStore';
import { useNavigate } from 'react-router-dom';

type Mode = 'chat' | 'live';

const pcmToAudioBuffer = (buffer: ArrayBuffer, ctx: AudioContext, sampleRate: number = 24000): AudioBuffer => {
    const pcm16 = new Int16Array(buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
    }
    const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32);
    return audioBuffer;
};

export const AITutor: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isOnline, chatMessages, addChatMessage, clearChatMessages } = useDataStore();
  const [mode, setMode] = useState<Mode>('chat');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [showSearchInfo, setShowSearchInfo] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveVolume, setLiveVolume] = useState(0);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const chatSessionRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOnline) startNewChat();
    return () => {
        cleanupAudio();
        stopCurrentTTS();
    };
  }, []);

  useEffect(() => {
    if (isOnline) startNewChat();
  }, [useThinking, useSearch, isOnline]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading, attachedFile]);

  const cleanupAudio = () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (inputProcessorRef.current) {
          try {
              inputProcessorRef.current.disconnect();
          } catch(e) {}
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
      }
      setIsLiveConnected(false);
  };

  const stopCurrentTTS = () => {
      if (currentSourceRef.current) {
          try {
              currentSourceRef.current.stop();
              currentSourceRef.current.disconnect();
          } catch (e) {}
          currentSourceRef.current = null;
      }
      if (audioContextRef.current && mode === 'chat') {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
      }
      setPlayingMessageId(null);
  };

  const startNewChat = () => {
      chatSessionRef.current = createChatSession({
          enableThinking: useThinking,
          enableSearch: useSearch
      });
  };

  const handleTTS = async (text: string, messageId: string) => {
      if (!isOnline) return;
      if (playingMessageId === messageId) {
          stopCurrentTTS();
          return;
      }
      stopCurrentTTS();
      try {
          const cleanText = text.replace(/[*#_~`\[\]()]/g, '').replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
          if (!cleanText) return;
          setPlayingMessageId(messageId);
          const audioBufferRaw = await generateSpeech(cleanText);
          const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioCtxClass) return;
          const ctx = new AudioCtxClass({ sampleRate: 24000 });
          audioContextRef.current = ctx;
          if (ctx.state === 'suspended') await ctx.resume();
          const buffer = pcmToAudioBuffer(audioBufferRaw, ctx, 24000);
          const source = ctx.createBufferSource();
          currentSourceRef.current = source;
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.onended = () => {
              if (playingMessageId === messageId) setPlayingMessageId(null);
              source.disconnect();
              ctx.close().catch(() => {});
          };
          source.start(0);
      } catch (e) {
          console.error("TTS Error", e);
          setPlayingMessageId(null);
      }
  };

  const handleSend = async (overrideText?: string) => {
    if (!isOnline) {
        alert("Tính năng Huy Long AI cần kết nối mạng để hoạt động.");
        return;
    }
    const textToSend = overrideText || input;
    if ((!textToSend.trim() && !attachedFile) || isLoading) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };
    addChatMessage(userMsg);
    setInput('');
    const currentFile = attachedFile;
    setAttachedFile(null);
    setIsLoading(true);
    try {
        if (chatSessionRef.current) {
            const fileToSend = currentFile ? { data: currentFile.data, mimeType: currentFile.mimeType } : undefined;
            const result = await sendMessageToGemini(chatSessionRef.current, userMsg.text, fileToSend);
            let finalText = result.text;
            if (result.grounding) {
                const links = result.grounding.map((chunk: any) => chunk.web?.uri).filter(Boolean);
                if (links.length > 0) {
                    finalText += "\n\nNguồn tham khảo:\n" + links.map((link: string) => `- ${link}`).join('\n');
                }
            }
            const aiMsgId = (Date.now() + 1).toString();
            const aiMsg: ChatMessage = {
                id: aiMsgId,
                role: 'model',
                text: finalText,
                timestamp: new Date().toISOString()
            };
            addChatMessage(aiMsg);
            handleTTS(finalText, aiMsgId);
        }
    } catch (err) {
        console.error("Send error", err);
    } finally {
        setIsLoading(false);
    }
  };

  const toggleRecording = async () => {
      if (!isOnline) return;
      if (isRecording) {
          mediaRecorderRef.current?.stop();
          setIsRecording(false);
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const mediaRecorder = new MediaRecorder(stream);
              mediaRecorderRef.current = mediaRecorder;
              audioChunksRef.current = [];
              mediaRecorder.ondataavailable = (event) => {
                  if (event.data.size > 0) audioChunksRef.current.push(event.data);
              };
              mediaRecorder.onstop = async () => {
                  const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                  const reader = new FileReader();
                  reader.readAsDataURL(audioBlob);
                  reader.onloadend = async () => {
                      const base64String = (reader.result as string).split(',')[1];
                      setIsLoading(true);
                      try {
                          const text = await transcribeAudio(base64String, 'audio/webm');
                          if (text) handleSend(text);
                          else setIsLoading(false);
                      } catch (err) {
                          setIsLoading(false);
                      }
                  };
                  stream.getTracks().forEach(track => track.stop());
              };
              mediaRecorder.start();
              setIsRecording(true);
          } catch (err) {
              alert("Không thể truy cập mic.");
          }
      }
  };

  const toggleLive = async () => {
      if (!isOnline) {
          alert("Tính năng Live cần kết nối mạng.");
          return;
      }
      if (isLiveConnected) {
          cleanupAudio();
          return;
      }
      try {
          setIsLiveConnected(true);
          const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtxClass({ sampleRate: 24000 });
          audioContextRef.current = ctx;
          nextStartTimeRef.current = 0;
          const outputNode = ctx.createGain();
          outputNode.connect(ctx.destination);
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          const inputCtx = new AudioCtxClass({ sampleRate: 16000 });
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          inputProcessorRef.current = processor;
          const sessionPromise = connectLiveSession({
              onOpen: () => console.log("Live Open"),
              onMessage: async (msg: LiveServerMessage) => {
                  const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                  if (base64Audio) {
                      const binaryString = atob(base64Audio);
                      const len = binaryString.length;
                      const bytes = new Uint8Array(len);
                      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                      const audioBuffer = pcmToAudioBuffer(bytes.buffer, ctx, 24000);
                      const sourceNode = ctx.createBufferSource();
                      sourceNode.buffer = audioBuffer;
                      sourceNode.connect(outputNode);
                      const currentTime = ctx.currentTime;
                      if (nextStartTimeRef.current < currentTime) nextStartTimeRef.current = currentTime;
                      sourceNode.start(nextStartTimeRef.current);
                      nextStartTimeRef.current += audioBuffer.duration;
                      setLiveVolume(Math.random() * 100);
                      setTimeout(() => setLiveVolume(0), audioBuffer.duration * 1000);
                  }
              },
              onError: (e) => setIsLiveConnected(false),
              onClose: () => setIsLiveConnected(false)
          });
          processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                  if (session && typeof session.sendRealtimeInput === 'function') {
                      session.sendRealtimeInput({ media: pcmBlob });
                  }
              });
          };
          source.connect(processor);
          processor.connect(inputCtx.destination);
      } catch (err) {
          setIsLiveConnected(false);
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
        setAttachedFile({ data: (reader.result as string).split(',')[1], mimeType: file.type, preview: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F2F4F7] dark:bg-[#0f151a] relative font-sans overflow-hidden">
       {!isOnline && (
           <div className="absolute top-24 left-4 right-4 z-[60] animate-fade-in-up">
               <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 rounded-2xl flex items-center gap-3 shadow-lg backdrop-blur-md">
                   <span className="material-symbols-outlined text-amber-500">wifi_off</span>
                   <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Đang ngoại tuyến.</p>
               </div>
           </div>
       )}
       
       <div className="absolute top-0 left-0 right-0 z-40 pt-safe px-4 pb-2 bg-white/80 dark:bg-[#141c24]/80 backdrop-blur-xl border-b border-white/50 dark:border-white/5">
         <div className="flex items-center gap-4 max-w-lg mx-auto">
            <button 
                onClick={() => navigate('/settings')}
                className="w-10 h-10 rounded-[18px] bg-primary overflow-hidden shadow-sm active:scale-90 transition-all shrink-0"
            >
                <img src={user?.avatar_url || "https://picsum.photos/200"} className="w-full h-full object-cover" alt="Profile" />
            </button>
            <div className="flex-1 flex justify-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <button onClick={() => setMode('chat')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'chat' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500'}`}>Huy Long</button>
                <button onClick={() => setMode('live')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'live' ? 'bg-white dark:bg-gray-700 shadow-sm text-red-500' : 'text-gray-500'}`}>Live</button>
            </div>
            <button onClick={() => { if(confirm("Xóa lịch sử trò chuyện?")) clearChatMessages(); }} className="p-2 text-gray-400 hover:text-red-500">
                <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
            </button>
         </div>
       </div>

       <div className="flex-1 pt-24 pb-40 overflow-hidden relative">
           {mode === 'chat' && (
               <>
                <div ref={scrollRef} className="h-full overflow-y-auto px-4 pb-4 space-y-6">
                    {chatMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                            <span className="material-symbols-outlined text-[48px] mb-4">forum</span>
                            <p className="text-sm font-bold uppercase tracking-widest">Hỏi Huy Long về bài tập của bạn</p>
                        </div>
                    )}
                    {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                                <div className="shrink-0 mb-1">
                                    {msg.role === 'model' ? (
                                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md relative">
                                            <span className="material-symbols-outlined text-[20px] font-bold">menu_book</span>
                                        </div>
                                    ) : (
                                        <div className="h-9 w-9 rounded-xl bg-gray-200 bg-cover bg-center border-2 border-white dark:border-gray-800 shadow-sm" style={{backgroundImage: `url('${user?.avatar_url || "https://picsum.photos/200"}')`}}></div>
                                    )}
                                </div>
                                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-3 rounded-2xl text-[15px] shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white dark:bg-[#1f2937] text-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-gray-700'}`}>
                                        {msg.text}
                                    </div>
                                    {msg.role === 'model' && isOnline && (
                                        <button 
                                            onClick={() => handleTTS(msg.text, msg.id)} 
                                            className={`mt-1 ml-1 transition-colors p-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${playingMessageId === msg.id ? 'text-red-500' : 'text-gray-400 hover:text-primary'}`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {playingMessageId === msg.id ? 'stop_circle' : 'volume_up'}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="text-xs text-gray-400 text-center animate-pulse py-2 flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    </div>}
                </div>
                {isOnline && (
                    <div className="absolute top-24 right-4 flex flex-col gap-3 z-50">
                        <button onClick={() => setUseThinking(!useThinking)} className={`p-2.5 rounded-2xl shadow-float transition-all active:scale-90 ${useThinking ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-400'}`} title="Suy nghĩ sâu">
                            <span className="material-symbols-outlined text-[20px]">psychology</span>
                        </button>
                        <button onClick={() => { setUseSearch(!useSearch); setShowSearchInfo(true); setTimeout(() => setShowSearchInfo(false), 2000); }} className={`p-2.5 rounded-2xl shadow-float transition-all active:scale-90 ${useSearch ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-400'}`} title="Google Search">
                            <span className="material-symbols-outlined text-[20px]">travel_explore</span>
                        </button>
                    </div>
                )}
                <div className="absolute bottom-28 left-4 right-4 z-30">
                    {attachedFile && (
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl mb-3 shadow-float inline-flex items-center gap-2 border border-gray-100 dark:border-gray-700 animate-fade-in-up">
                            <img src={attachedFile.preview} className="h-10 w-10 object-cover rounded-xl" />
                            <button onClick={() => setAttachedFile(null)} className="text-red-500 p-1"><span className="material-symbols-outlined text-[18px]">close</span></button>
                        </div>
                    )}
                    <div className={`bg-white dark:bg-[#141c24] p-2 rounded-[28px] shadow-float border border-gray-100 dark:border-gray-700 flex items-center gap-2 ${!isOnline ? 'opacity-50' : ''}`}>
                         <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">image</span></button>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                         <button onClick={toggleRecording} className={`p-2.5 transition-all rounded-full ${isRecording ? 'text-white bg-red-500 animate-pulse' : 'text-gray-400 hover:text-primary'}`}><span className="material-symbols-outlined">{isRecording ? 'stop' : 'mic'}</span></button>
                         <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={isRecording ? "Đang lắng nghe..." : "Hỏi Huy Long..."} className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2" disabled={isRecording || !isOnline} />
                         <button onClick={() => handleSend()} disabled={isLoading || isRecording || !isOnline} className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 active:scale-90 transition-all disabled:bg-gray-300"><span className="material-symbols-outlined font-bold">send</span></button>
                    </div>
                </div>
               </>
           )}
           {mode === 'live' && (
               <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in-up">
                   <div className={`relative w-48 h-48 rounded-[48px] flex items-center justify-center transition-all ${isLiveConnected ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800'}`}>
                       {isLiveConnected && <div className="absolute inset-0 rounded-[48px] border-4 border-primary opacity-30 animate-ping"></div>}
                       <div className="w-40 h-40 bg-gradient-to-br from-primary to-indigo-600 rounded-[40px] flex flex-col items-center justify-center shadow-2xl z-10 transition-transform duration-75" style={{ transform: `scale(${1 + liveVolume / 150})` }}>
                           <span className="material-symbols-outlined text-white text-[56px] font-bold">menu_book</span>
                       </div>
                   </div>
                   <div className="mt-10 space-y-2">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{isLiveConnected ? "Huy Long đang nghe..." : "Huy Long Live"}</h2>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Trò chuyện trực tiếp bằng giọng nói</p>
                   </div>
                   <button onClick={toggleLive} disabled={!isOnline} className={`mt-12 px-10 py-5 rounded-[24px] font-black tracking-widest uppercase text-xs transition-all shadow-xl active:scale-95 disabled:opacity-50 ${isLiveConnected ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-primary border-2 border-primary/20 hover:border-primary/50' }`}>
                        {isLiveConnected ? "DỪNG TRÒ CHUYỆN" : "BẮT ĐẦU LIVE"}
                   </button>
               </div>
           )}
       </div>
    </div>
  );
};
