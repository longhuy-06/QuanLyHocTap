
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

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    if (viewMode === 'month') {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
        setCurrentDate(new Date(currentDate.getFullYear() - 12, currentDate.getMonth(), 1));
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
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

  const handleConfirm = (e: React.MouseEvent) => {
      e.preventDefault();
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
          type="button"
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up p-4" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-[40px] p-6 shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl mb-6">
          <button type="button" onClick={() => setViewMode('month')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-400'}`}>Tháng</button>
          <button type="button" onClick={() => setViewMode('year')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'year' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-gray-400'}`}>Năm</button>
        </div>

        <div className="flex items-center justify-between mb-6 px-2">
          <button type="button" onClick={handlePrev} className="p-2 text-gray-400"><span className="material-symbols-outlined">chevron_left</span></button>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            {viewMode === 'month' ? `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}` : `${currentDate.getFullYear() - 5} - ${currentDate.getFullYear() + 6}`}
          </h2>
          <button type="button" onClick={handleNext} className="p-2 text-gray-400"><span className="material-symbols-outlined">chevron_right</span></button>
        </div>

        {viewMode === 'month' ? (
             <div className="grid grid-cols-7 gap-y-2 mb-4">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase">{day}</div>)}
                {renderDays()}
            </div>
        ) : (
            <div className="mb-4 grid grid-cols-4 gap-3">
                {Array.from({length: 12}, (_, i) => currentDate.getFullYear() - 5 + i).map(y => (
                    <button key={y} type="button" onClick={() => handleYearClick(y)} className={`h-12 rounded-xl text-sm font-bold ${selectedDate.getFullYear() === y ? 'bg-primary text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}>{y}</button>
                ))}
            </div>
        )}

        <div className="flex items-center justify-center gap-6 py-6 border-t border-gray-100 dark:border-gray-800 mt-4">
            <TimeSelect value={selectedHour} onChange={setSelectedHour} max={23} label="Giờ" />
            <span className="text-2xl font-black text-gray-200 mt-4">:</span>
            <TimeSelect value={selectedMinute} onChange={setSelectedMinute} max={55} step={5} label="Phút" />
        </div>
        
        <div className="flex gap-4 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-gray-400 bg-gray-50 dark:bg-gray-800 uppercase text-[10px] tracking-widest">Hủy bỏ</button>
            <button type="button" onClick={handleConfirm} className="flex-1 py-4 rounded-2xl font-black text-white bg-primary shadow-xl shadow-primary/30 uppercase text-[10px] tracking-widest">Áp dụng</button>
        </div>
      </div>
    </div>
  );
};

const TimeSelect: React.FC<{ value: number, onChange: (v: number) => void, max: number, step?: number, label: string }> = ({ value, onChange, max, step = 1, label }) => (
    <div className="flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <div className="relative">
            <select 
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="appearance-none bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-2 px-6 font-black text-gray-900 dark:text-white text-xl focus:ring-2 focus:ring-primary outline-none cursor-pointer"
            >
                {Array.from({length: (max / step) + 1}, (_, i) => i * step).map((v) => (
                    <option key={v} value={v}>{v.toString().padStart(2, '0')}</option>
                ))}
            </select>
        </div>
    </div>
);
