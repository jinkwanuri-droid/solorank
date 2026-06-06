import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, setHours, setMinutes } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomDateTimePickerProps {
  value: string; // ISO string
  onChange: (value: string) => void;
  label: string;
  id?: string;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ value, onChange, label, id = label.replace(/\s+/g, '-') }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTimePickerExpanded, setIsTimePickerExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dateObj = value ? parseISO(value) : new Date();
  const [viewDate, setViewDate] = useState(dateObj);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsTimePickerExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll to selected time
  useEffect(() => {
    if (isOpen && isTimePickerExpanded) {
      const scrollHour = () => {
        const h = dateObj.getHours();
        const el = document.getElementById(`hour-opt-${id}-${h}`);
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      };
      const scrollMin = () => {
        const m = Math.floor(dateObj.getMinutes() / 10) * 10;
        const el = document.getElementById(`min-opt-${id}-${m}`);
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      };
      
      // Delay slightly for animation to finish
      const timer = setTimeout(() => {
        scrollHour();
        scrollMin();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, dateObj, id]);

  const handleDateSelect = (day: Date) => {
    const updated = new Date(day);
    updated.setHours(dateObj.getHours(), dateObj.getMinutes());
    onChange(updated.toISOString());
  };

  const handleTimeChange = (type: 'h' | 'm', val: string) => {
    const num = parseInt(val) || 0;
    let updated = new Date(dateObj);
    if (type === 'h') updated = setHours(updated, Math.min(23, Math.max(0, num)));
    else updated = setMinutes(updated, Math.min(59, Math.max(0, num)));
    onChange(updated.toISOString());
  };

  // Calendar calculations
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="space-y-1.5 relative" ref={containerRef} id={`datetime-picker-${id}`}>
      <div className="flex items-center gap-2 mb-1 px-1">
        <div className="w-1 h-3 bg-blue-500 rounded-full" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>

      {/* Trigger Button */}
      <button
        id={`datetime-trigger-${id}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 hover:border-blue-400 transition-all shadow-sm shadow-slate-100/50 group"
      >
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-4 h-4 text-blue-500" />
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span id={`date-display-${id}`} className="text-sm font-bold text-slate-800">{format(dateObj, 'yyyy. MM. dd')}</span>
            <span className="text-slate-200 text-xs">|</span>
            <span id={`time-display-${id}`} className="text-xs font-black text-blue-500">{format(dateObj, 'HH:mm')}</span>
            <span className="text-[10px] font-medium text-slate-300">24H</span>
          </div>
        </div>
        <ChevronLeft className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
      </button>

      {/* Modern Apple-style Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={`datetime-picker-popup-${id}`}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute z-[100] top-full left-0 mt-2 bg-white border border-slate-200 rounded-[28px] shadow-2xl shadow-slate-200/50 p-5 w-[300px] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <span id={`month-year-title-${id}`} className="text-sm font-black text-slate-900 tracking-tight">
                {format(viewDate, 'MMMM yyyy')}
              </span>
              <div className="flex gap-1">
                <button 
                  id={`prev-month-btn-${id}`}
                  type="button"
                  onClick={() => setViewDate(subMonths(viewDate, 1))}
                  className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-blue-500"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  id={`next-month-btn-${id}`}
                  type="button"
                  onClick={() => setViewDate(addMonths(viewDate, 1))}
                  className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-blue-500"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-slate-300 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 flex-1">
              {calendarDays.map((day, i) => {
                const isSelected = isSameDay(day, dateObj);
                const isCurrentMonth = isSameMonth(day, monthStart);
                return (
                  <button
                    key={i}
                    id={`day-btn-${id}-${format(day, 'yyyyMMdd')}`}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`
                      relative aspect-square rounded-full text-[11px] font-bold transition-all flex items-center justify-center
                      ${isSelected 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110 z-10' 
                        : isCurrentMonth 
                          ? 'text-slate-700 hover:bg-slate-100' 
                          : 'text-slate-300'
                      }
                    `}
                  >
                    {format(day, 'd')}
                    {isSameDay(day, new Date()) && !isSelected && (
                      <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Time Picker Section - Compact Toggle and Expandable Scrollers */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 px-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">시간</span>
                </div>
                
                <button
                  id={`time-expand-toggle-${id}`}
                  type="button"
                  onClick={() => setIsTimePickerExpanded(!isTimePickerExpanded)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all
                    ${isTimePickerExpanded ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}
                  `}
                >
                  <span className="text-xs font-black">{format(dateObj, 'HH:mm')}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${isTimePickerExpanded ? 'bg-white' : 'bg-blue-500'} animate-pulse`} />
                </button>
              </div>

              <AnimatePresence>
                {isTimePickerExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 128, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2 h-32 py-2">
                      {/* Hour Column */}
                      <div id={`hour-scroll-${id}`} className="flex-1 flex flex-col items-center overflow-y-auto scrollbar-none scroll-smooth bg-slate-50/50 rounded-2xl py-1">
                        <span className="text-[9px] font-bold text-slate-300 uppercase mb-2">시</span>
                        {Array.from({ length: 24 }).map((_, h) => {
                          const isSelected = dateObj.getHours() === h;
                          return (
                            <button
                              key={h}
                              id={`hour-opt-${id}-${h}`}
                              type="button"
                              onClick={() => handleTimeChange('h', h.toString())}
                              className={`w-full py-1.5 text-xs font-bold transition-all ${
                                isSelected ? 'bg-blue-600 text-white rounded-lg scale-105 shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {format(setHours(new Date(), h), 'HH')}
                            </button>
                          );
                        })}
                      </div>

                      {/* Minute Column (10min steps) */}
                      <div id={`min-scroll-${id}`} className="flex-1 flex flex-col items-center overflow-y-auto scrollbar-none scroll-smooth bg-slate-50/50 rounded-2xl py-1">
                        <span className="text-[9px] font-bold text-slate-300 uppercase mb-2">분</span>
                        {[0, 10, 20, 30, 40, 50].map((m) => {
                          const isSelected = dateObj.getMinutes() === m;
                          return (
                            <button
                              key={m}
                              id={`min-opt-${id}-${m}`}
                              type="button"
                              onClick={() => handleTimeChange('m', m.toString())}
                              className={`w-full py-1.5 text-xs font-bold transition-all ${
                                isSelected ? 'bg-blue-600 text-white rounded-lg scale-105 shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {m.toString().padStart(2, '0')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Action */}
            <div className="mt-6 grid grid-cols-2 gap-3">
               <button 
                id={`picker-cancel-btn-${id}`}
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-3 items-center justify-center bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black hover:bg-slate-200 transition-all"
               >
                 취소
               </button>
               <button 
                id={`picker-confirm-btn-${id}`}
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-3 items-center justify-center bg-blue-600 text-white rounded-2xl text-[11px] font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
               >
                 확인
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDateTimePicker;
