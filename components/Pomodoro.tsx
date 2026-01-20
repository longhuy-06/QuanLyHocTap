
import React, { useState, useEffect, useRef } from 'react';

export const Pomodoro: React.FC = () => {
  // Mặc định 60 phút
  const [totalTime, setTotalTime] = useState(60 * 60);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [isActive, setIsActive] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const presets = [
    { label: 'Ngắn', minutes: 15 },
    { label: 'Tiêu chuẩn', minutes: 25 },
    { label: 'Tập trung', minutes: 60 },
    { label: 'Dài', minutes: 120 },
  ];

  useEffect(() => {
    let interval: number | undefined;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowMenu(false);
        }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(totalTime);
  };

  const handleSelectTime = (minutes: number) => {
      const seconds = minutes * 60;
      setTotalTime(seconds);
      setTimeLeft(seconds);
      setIsActive(false);
      setShowMenu(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const minutes = parseInt(e.target.value);
      const seconds = minutes * 60;
      setTotalTime(seconds);
      setTimeLeft(seconds);
      setIsActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((totalTime - timeLeft) / (totalTime || 1)) * 100;

  return (
    <div className="w-full bg-surface-light dark:bg-surface-dark rounded-3xl p-5 shadow-soft dark:shadow-none dark:border dark:border-gray-800 relative overflow-visible group transition-all hover:shadow-glow z-20">
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div 
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-indigo-400 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          ></div>
      </div>

      <div className="flex flex-col gap-5 relative z-10">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                <span className={`material-symbols-outlined text-[24px] ${isActive ? 'animate-pulse' : ''}`}>
                  {isActive ? 'timer' : 'timer_off'}
                </span>
              </div>
              <div>
                <div 
                    className="font-mono text-3xl font-bold text-text-main dark:text-white leading-none tracking-tight cursor-pointer hover:text-primary transition-colors select-none"
                    onClick={() => setShowMenu(!showMenu)}
                >
                  {formatTime(timeLeft)}
                </div>
                <p className="text-xs font-medium text-text-muted mt-1">
                  {isActive ? 'Đang tập trung...' : 'Sẵn sàng học tập'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative">
              <div ref={menuRef}>
                <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">tune</span>
                </button>
                {showMenu && (
                    <div className="absolute right-0 top-12 w-40 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-1.5 animate-fade-in-up origin-top-right z-30">
                        <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gợi ý</p>
                        {presets.map((preset) => (
                            <button
                                key={preset.minutes}
                                onClick={() => handleSelectTime(preset.minutes)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex justify-between items-center ${totalTime === preset.minutes * 60 ? 'bg-primary/10 text-primary' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                                <span>{preset.minutes} phút</span>
                            </button>
                        ))}
                    </div>
                )}
              </div>
              
              {!isActive && timeLeft !== totalTime && (
                 <button onClick={resetTimer} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                  </button>
              )}
              
              <button 
                onClick={toggleTimer}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${isActive ? 'bg-orange-500' : 'bg-primary'}`}
              >
                <span className="material-symbols-outlined text-[26px] fill-1">
                  {isActive ? 'pause' : 'play_arrow'}
                </span>
              </button>
            </div>
        </div>

        {/* Range Slider for adjusting time */}
        <div className="px-2 pb-1">
            <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-gray-400 uppercase">
                <span>0p</span>
                <span className="text-primary">{Math.floor(totalTime / 60)} phút tập trung</span>
                <span>120p</span>
            </div>
            <input 
                type="range" 
                min="1" 
                max="120" 
                step="5"
                value={Math.floor(totalTime / 60)} 
                onChange={handleSliderChange}
                disabled={isActive}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
        </div>
      </div>
    </div>
  );
};
