
import React, { useState, useEffect } from 'react';

interface CalendarPickerProps {
  initialDate?: string; // Format "DD/MM/YYYY HH:mm"
  onSelect: (dateString: string) => void;
  onClose: () => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({ initialDate, onSelect, onClose }) => {
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState(Math.floor(new Date().getMinutes() / 5) * 5);

  // Parse initial date
  useEffect(() => {
    if (initialDate) {
        // Format: "DD/MM/YYYY HH:mm"
        const [datePart, timePart] = initialDate.split(' ');
        
        if (datePart) {
            const parts = datePart.split('/');
            if (parts.length >= 2) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parts.length === 3 ? parseInt(parts[2], 10) : new Date().getFullYear();
                
                if (!isNaN(day) && !isNaN(month)) {
                    const date = new Date(year, month, day);
                    setSelectedDate(date);
                    setCurrentDate(date);
                }
            }
        }

        if (timePart) {
            const [h, m] = timePart.split(':');
            if (!isNaN(parseInt(h))) setSelectedHour(parseInt(h));
            if (!isNaN(parseInt(m))) setSelectedMinute(parseInt(m));
        }
    }
  }, [initialDate]);

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handlePrev = () => {
    if (viewMode === 'month') {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
        setCurrentDate(new Date(currentDate.getFullYear() - 12, currentDate.getMonth(), 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
        setCurrentDate(new Date(currentDate.getFullYear() + 12, currentDate.getMonth(), 1));
    }
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleYearClick = (year: number) => {
      const newDate = new Date(year, currentDate.getMonth(), 1);
      setCurrentDate(newDate);
      setViewMode('month');
  };

  const handleConfirm = () => {
      const dayStr = selectedDate.getDate().toString().padStart(2, '0');
      const monthStr = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const yearStr = selectedDate.getFullYear().toString();
      const hourStr = selectedHour.toString().padStart(2, '0');
      const minuteStr = selectedMinute.toString().padStart(2, '0');
      
      onSelect(`${dayStr}/${monthStr}/${yearStr} ${hourStr}:${minuteStr}`);
  };

  const renderDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate.getMonth(), currentDate.getFullYear());
    const startDay = firstDayOfMonth(currentDate.getMonth(), currentDate.getFullYear());

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-full"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const isSelected = 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear();
      
      const isToday = 
        new Date().getDate() === day &&
        new Date().getMonth() === currentDate.getMonth() &&
        new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`
            h-10 w-full flex flex-col items-center justify-center rounded-full text-sm font-medium transition-all relative
            ${isSelected 
              ? 'bg-primary text-white shadow-lg shadow-primary/30 font-bold' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        >
          {day}
          {!isSelected && isToday && (
             <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></div>
          )}
        </button>
      );
    }
    return days;
  };

  const renderYears = () => {
      const currentYear = currentDate.getFullYear();
      const startYear = currentYear - 5;
      const endYear = currentYear + 6;
      const years = [];

      for (let y = startYear; y <= endYear; y++) {
          const isSelected = selectedDate.getFullYear() === y;
          const isCurrentYear = new Date().getFullYear() === y;

          years.push(
              <button
                key={y}
                onClick={() => handleYearClick(y)}
                className={`
                    h-12 w-full rounded-xl text-sm font-medium transition-all relative
                    ${isSelected 
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 font-bold' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                `}
              >
                  {y}
                  {!isSelected && isCurrentYear && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary"></div>
                  )}
              </button>
          );
      }
      return <div className="grid grid-cols-4 gap-3">{years}</div>;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in-up p-4" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-2xl border border-gray-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-2xl mb-6">
          <button 
            onClick={() => setViewMode('month')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${viewMode === 'month' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Tháng
          </button>
          <button 
            onClick={() => setViewMode('year')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${viewMode === 'year' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Năm
          </button>
        </div>

        <div className="flex items-center justify-between mb-6 px-2">
          <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {viewMode === 'month' 
                ? `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}` 
                : `${currentDate.getFullYear() - 5} - ${currentDate.getFullYear() + 6}`
            }
          </h2>
          <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
             <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {viewMode === 'month' ? (
             <div className="grid grid-cols-7 gap-y-2 mb-4">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-400 mb-2">
                    {day}
                    </div>
                ))}
                {renderDays()}
            </div>
        ) : (
            <div className="mb-4">
                {renderYears()}
            </div>
        )}

        {/* Time Picker Section */}
        <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-gray-400">Giờ</span>
                <div className="relative">
                    <select 
                        value={selectedHour}
                        onChange={(e) => setSelectedHour(Number(e.target.value))}
                        className="appearance-none bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-2 pl-4 pr-8 font-bold text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                    >
                        {Array.from({length: 24}, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm">expand_more</span>
                </div>
            </div>
            <span className="text-xl font-bold text-gray-300 mt-5">:</span>
            <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-gray-400">Phút</span>
                <div className="relative">
                    <select 
                        value={selectedMinute}
                        onChange={(e) => setSelectedMinute(Number(e.target.value))}
                        className="appearance-none bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-2 pl-4 pr-8 font-bold text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                    >
                        {Array.from({length: 12}, (_, i) => i * 5).map((m) => (
                            <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm">expand_more</span>
                </div>
            </div>
        </div>
        
        <div className="flex gap-3 mt-4">
            <button 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                Hủy
            </button>
            <button 
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/30 transition-colors"
            >
                Lưu
            </button>
        </div>
      </div>
    </div>
  );
};
