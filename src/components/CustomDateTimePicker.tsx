import React, { useState, useRef, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  setHours, 
  setMinutes,
  getHours,
  getMinutes,
  isToday,
  parseISO
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomDateTimePickerProps {
  value: string; // ISO string
  onChange: (value: string) => void;
  label: string;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(value));
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = new Date(value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (day: Date) => {
    const newDate = setHours(setMinutes(day, getMinutes(selectedDate)), getHours(selectedDate));
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (type: 'hours' | 'minutes' | 'ampm', val: number | string) => {
    let newDate = new Date(selectedDate);
    if (type === 'hours') {
      const currentHours = getHours(newDate);
      const isPm = currentHours >= 12;
      const h = Number(val);
      if (isPm) {
        newDate = setHours(newDate, h === 12 ? 12 : h + 12);
      } else {
        newDate = setHours(newDate, h === 12 ? 0 : h);
      }
    } else if (type === 'minutes') {
      newDate = setMinutes(newDate, Number(val));
    } else if (type === 'ampm') {
      const currentHours = getHours(newDate);
      if (val === 'PM' && currentHours < 12) {
        newDate = setHours(newDate, currentHours + 12);
      } else if (val === 'AM' && currentHours >= 12) {
        newDate = setHours(newDate, currentHours - 12);
      }
    }
    onChange(newDate.toISOString());
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
          </span>
        </div>
        <div className="flex gap-1">
          <button 
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, i) => (
          <div key={day} className={`text-[10px] font-bold text-center py-2 ${i === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = new Date(day);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);

        days.push(
          <div
            key={day.toString()}
            className={`relative h-8 flex items-center justify-center text-xs cursor-pointer transition-all rounded-lg
              ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
              ${isSelected ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-100'}
              ${isTodayDate && !isSelected ? 'text-blue-600 font-bold' : ''}
            `}
            onClick={() => handleDateSelect(cloneDay)}
          >
            <span>{formattedDate}</span>
            {isTodayDate && !isSelected && (
              <div className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="px-2">{rows}</div>;
  };

  const currentHours = getHours(selectedDate);
  const displayHours = currentHours % 12 === 0 ? 12 : currentHours % 12;
  const currentMinutes = getMinutes(selectedDate);
  const ampm = currentHours >= 12 ? 'PM' : 'AM';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          {format(selectedDate, 'yyyy-MM-dd aaa hh:mm', { locale: ko })}
        </span>
        <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 mt-2 z-[60] bg-white border border-slate-200 rounded-[32px] shadow-2xl p-1 flex flex-col w-[320px] overflow-hidden"
          >
            {/* Calendar Part */}
            <div className="p-2">
              {renderHeader()}
              <div className="p-1">
                {renderDays()}
                {renderCells()}
              </div>
            </div>

            {/* Time Part - Vertical Integration */}
            <div className="bg-slate-50 p-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3 text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">TIME SELECT</span>
                </div>
                <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                  {['AM', 'PM'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleTimeChange('ampm', p)}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                        ampm === p ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-4 h-32">
                {/* Hours Scroll */}
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-none h-full bg-white/50 rounded-xl p-1 border border-slate-100">
                  {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleTimeChange('hours', h)}
                      className={`h-8 shrink-0 rounded-lg text-[11px] font-bold transition-all ${
                        displayHours === h ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  ))}
                </div>
                
                <div className="text-slate-300 font-bold">:</div>

                {/* Minutes Scroll */}
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-none h-full bg-white/50 rounded-xl p-1 border border-slate-100">
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleTimeChange('minutes', m)}
                      className={`h-8 shrink-0 rounded-lg text-[11px] font-bold transition-all ${
                        Math.abs(currentMinutes - m) <= 2 ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between mt-4 px-1">
                <button 
                  type="button"
                  onClick={() => onChange(new Date().toISOString())}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  지우기
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    onChange(today.toISOString());
                    setCurrentMonth(today);
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  오늘로 설정
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDateTimePicker;
