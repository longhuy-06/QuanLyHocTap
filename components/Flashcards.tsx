
import React, { useState } from 'react';
import { useDataStore } from '../lib/store/dataStore';
import { generateFlashcardsFromText } from '../services/geminiService';
import { FlashcardSet } from '../types';

export const Flashcards: React.FC = () => {
  const { subjects, flashcardSets, addFlashcardSet, deleteFlashcardSet } = useDataStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '');
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim() || isGenerating) return;
    setIsGenerating(true);
    const cards = await generateFlashcardsFromText(inputText);
    if (cards.length > 0) {
      // Fix: Using snake_case for FlashcardSet properties to match interface
      const newSet: FlashcardSet = {
        id: Date.now().toString(),
        title: inputText.substring(0, 20) + '...',
        subject_id: selectedSubject,
        cards: cards.map((c, i) => ({ id: i.toString(), front: c.front, back: c.back })),
        created_at: new Date().toISOString()
      };
      addFlashcardSet(newSet);
      setInputText('');
    }
    setIsGenerating(false);
  };

  const activeSet = flashcardSets.find(s => s.id === activeSetId);

  if (activeSet) {
    const card = activeSet.cards[currentCardIndex];
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark p-6 pb-24 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-8">
          <button onClick={() => setActiveSetId(null)} className="p-2 bg-white dark:bg-surface-dark rounded-full shadow-sm">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="font-bold text-lg">{activeSet.title}</h2>
          <span className="text-sm font-medium text-gray-400">{currentCardIndex + 1}/{activeSet.cards.length}</span>
        </div>

        <div 
          className="relative w-full max-w-sm aspect-[3/4] cursor-pointer perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-white dark:bg-surface-dark rounded-[32px] shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center p-8 text-center">
              <span className="text-xs font-bold text-primary mb-4 uppercase tracking-widest">Câu hỏi</span>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{card.front}</p>
              <div className="mt-auto text-gray-300">
                <span className="material-symbols-outlined text-[40px]">touch_app</span>
                <p className="text-[10px] font-bold">NHẤN ĐỂ XEM ĐÁP ÁN</p>
              </div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary rounded-[32px] shadow-xl flex flex-col items-center justify-center p-8 text-center text-white">
              <span className="text-xs font-bold text-white/60 mb-4 uppercase tracking-widest">Đáp án</span>
              <p className="text-xl font-bold">{card.back}</p>
              <div className="mt-auto">
                <span className="material-symbols-outlined text-[40px] opacity-30">verified</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8 w-full max-w-sm">
          <button 
            disabled={currentCardIndex === 0}
            onClick={() => { setCurrentCardIndex(v => v - 1); setIsFlipped(false); }}
            className="flex-1 py-4 bg-white dark:bg-surface-dark rounded-2xl font-bold shadow-sm disabled:opacity-30"
          >
            Trước
          </button>
          <button 
            disabled={currentCardIndex === activeSet.cards.length - 1}
            onClick={() => { setCurrentCardIndex(v => v + 1); setIsFlipped(false); }}
            className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg disabled:opacity-30"
          >
            Tiếp theo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 max-w-lg mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Thẻ ghi nhớ AI</h1>
        <p className="text-gray-500 text-sm">Tạo flashcards từ ghi chú của bạn để học hiệu quả hơn.</p>
      </header>

      <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] shadow-soft space-y-4">
        <textarea 
          placeholder="Dán nội dung bài học vào đây để Huy Long giúp bạn tạo thẻ..."
          className="w-full h-32 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {subjects.map(s => (
            <button 
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedSubject === s.id ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || !inputText.trim()}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <><span className="material-symbols-outlined">auto_awesome</span> Tạo thẻ ngay</>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold">Bộ sưu tập của bạn</h2>
        {flashcardSets.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Chưa có bộ thẻ nào.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {flashcardSets.map(set => (
              <div 
                key={set.id}
                onClick={() => { setActiveSetId(set.id); setCurrentCardIndex(0); setIsFlipped(false); }}
                className="bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">style</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{set.title}</h3>
                    {/* Fix: Using subject_id */}
                    <p className="text-xs text-gray-500">{set.cards.length} thẻ • {subjects.find(s => s.id === set.subject_id)?.name}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteFlashcardSet(set.id); }}
                  className="p-2 text-gray-300 hover:text-red-500"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
