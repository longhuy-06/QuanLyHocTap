
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useDataStore } from '../lib/store/dataStore';
import { Subject } from '../types';

const SUBJECTS_LIST = [
  { id: 'math', name: 'Toán học', icon: 'functions', color: 'blue' },
  { id: 'lit', name: 'Ngữ văn', icon: 'menu_book', color: 'pink' },
  { id: 'eng', name: 'Tiếng Anh', icon: 'language', color: 'green' },
  { id: 'chi', name: 'Tiếng Trung', icon: 'translate', color: 'red' },
  { id: 'code', name: 'Lập trình', icon: 'terminal', color: 'indigo' },
  { id: 'phy', name: 'Vật lý', icon: 'science', color: 'violet' },
  { id: 'chem', name: 'Hóa học', icon: 'biotech', color: 'orange' },
  { id: 'bio', name: 'Sinh học', icon: 'psychology', color: 'emerald' },
];

const COLOR_MAP: Record<string, string> = {
  blue: '#3b82f6',
  pink: '#ec4899',
  green: '#10b981',
  red: '#ef4444',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  orange: '#f97316',
  emerald: '#10b981'
};

export const SubjectSelection: React.FC = () => {
  const navigate = useNavigate();
  const { setSubjects } = useDataStore();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['math', 'eng', 'code']);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    setIsLoading(true);
    
    const subjectsToSave: Subject[] = SUBJECTS_LIST
      .filter(sub => selectedSubjects.includes(sub.id))
      .map(sub => ({
        id: sub.id,
        name: sub.name,
        color: COLOR_MAP[sub.color] || '#6b7280'
      }));

    setSubjects(subjectsToSave);

    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-6 flex flex-col relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col z-10">
        <header className="mb-8 mt-4 animate-fade-in-up">
          <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2 leading-tight">
            Bạn đang tập trung vào <br />
            <span className="text-primary">những môn học nào?</span>
          </h1>
          <p className="text-text-muted dark:text-gray-400 text-sm">
            Chọn các môn học để SoftStudy AI cá nhân hóa lộ trình và tài liệu hỗ trợ cho bạn.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-8 flex-1 content-start animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {SUBJECTS_LIST.map((sub) => {
            const isSelected = selectedSubjects.includes(sub.id);
            return (
              <div 
                key={sub.id}
                onClick={() => toggleSubject(sub.id)}
                className={`
                  relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2
                  ${isSelected 
                    ? 'bg-white dark:bg-surface-dark border-primary shadow-lg shadow-primary/10 scale-[1.02]' 
                    : 'bg-white/50 dark:bg-surface-dark/50 border-transparent hover:bg-white dark:hover:bg-surface-dark hover:shadow-soft'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-${sub.color}-600 bg-${sub.color}-100 dark:bg-${sub.color}-900/20`}>
                    <span className="material-symbols-outlined text-[24px]">{sub.icon}</span>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-primary text-[20px] animate-fade-in-up">check_circle</span>
                  )}
                </div>
                <h3 className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-text-main dark:text-gray-200'}`}>
                  {sub.name}
                </h3>
              </div>
            );
          })}
        </div>

        <div className="pb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
           <Button 
            className="w-full h-14 text-base font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={handleContinue}
            disabled={isLoading || selectedSubjects.length === 0}
           >
             {isLoading ? 'Đang thiết lập...' : 'Hoàn tất & Vào Dashboard'}
           </Button>
           <p className="text-center text-xs text-text-muted mt-4">
             Bạn có thể thay đổi danh sách này sau trong phần Cài đặt.
           </p>
        </div>
      </div>
    </div>
  );
};
