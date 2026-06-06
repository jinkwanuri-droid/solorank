import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

interface CustomDateTimePickerProps {
  value: string; // ISO string
  onChange: (value: string) => void;
  label: string;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ value, onChange, label }) => {
  // datetime-local expects "YYYY-MM-DDThh:mm" format in local time
  const formattedValue = value ? format(parseISO(value), "yyyy-MM-dd'T'HH:mm") : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const date = new Date(e.target.value);
      if (!isNaN(date.getTime())) {
        onChange(date.toISOString());
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 hover:bg-slate-100 transition-colors focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50/50">
        <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
        <input
          type="datetime-local"
          value={formattedValue}
          onChange={handleChange}
          className="w-full pl-8 pr-2 py-1.5 bg-transparent text-sm text-slate-800 font-bold focus:outline-none cursor-pointer"
        />
      </div>
    </div>
  );
};

export default CustomDateTimePicker;
