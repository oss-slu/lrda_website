import * as React from 'react';
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { CaptionProps } from 'react-day-picker';

interface TimePickerProps {
  initialDate?: Date; // Now optional — will fall back to today if not provided
  onTimeChange?: (date: Date) => void;
  disabled?: boolean; // Whether the time picker is disabled (read-only)
}

function formatDateTime(date: Date) {
  if (!date) return 'Pick a date';
  return `${date.toDateString()}`;
}

type CustomCaptionProps = CaptionProps & {
  onMonthChange?: (date: Date) => void;
  onDayClick?: (date: Date) => void;
};

function CaptionDropdowns(props: any) {
  const { displayMonth, onMonthChange, onDayClick } = props;
  const fromYear = 1200;
  const toYear = new Date().getFullYear();

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'long' }),
  );
  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);

  const handleChange = (newMonth: number, newYear: number) => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(newMonth);
    newDate.setFullYear(newYear);
    newDate.setDate(1);
    onMonthChange?.(newDate);
    onDayClick?.(newDate);
  };

  return (
    <div className='flex space-x-2 px-3 py-2'>
      <select
        className='rounded-md border px-2 py-1 text-sm'
        value={displayMonth.getMonth()}
        onChange={e => handleChange(parseInt(e.target.value), displayMonth.getFullYear())}
      >
        {months.map((month, idx) => (
          <option key={idx} value={idx}>
            {month}
          </option>
        ))}
      </select>
      <select
        className='rounded-md border px-2 py-1 text-sm'
        value={displayMonth.getFullYear()}
        onChange={e => handleChange(displayMonth.getMonth(), parseInt(e.target.value))}
      >
        {years.map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function TimePicker({
  initialDate,
  onTimeChange,
  disabled = false,
}: TimePickerProps) {
  // Use lazy initializer to set initial date from prop
  const [date, setDate] = useState(() => initialDate || new Date());
  const [viewMonth, setViewMonth] = useState(() => initialDate || new Date());

  // Only sync when initialDate changes from parent (e.g., loading different note)
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
      setViewMonth(initialDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDate?.getTime()]);

  const formatTimeForInput = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleDayClick = (newDay: Date) => {
    const updatedDate = new Date(date);
    updatedDate.setFullYear(newDay.getFullYear(), newDay.getMonth(), newDay.getDate());
    setDate(updatedDate);
    onTimeChange?.(updatedDate);
    setViewMonth(newDay);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = event.target.value.split(':').map(Number);
    const updatedDate = new Date(date);
    updatedDate.setHours(hours, minutes);
    setDate(updatedDate);
    onTimeChange?.(updatedDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          disabled={disabled}
          className={`group inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            disabled ? 'cursor-not-allowed opacity-50' : ''
          }`}
          aria-label='Open Calendar'
          type='button'
        >
          <CalendarIcon className='h-4 w-4 text-gray-700 group-hover:text-blue-600' />
          <span className='text-gray-700 group-hover:text-gray-900'>{formatDateTime(date)}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent className='w-auto'>
        <Calendar
          mode='single'
          selected={date}
          onDayClick={handleDayClick}
          month={viewMonth}
          onMonthChange={setViewMonth}
          initialFocus
          components={
            {
              Caption: (props: any) => (
                <CaptionDropdowns
                  {...props}
                  onMonthChange={setViewMonth}
                  onDayClick={handleDayClick}
                />
              ),
            } as any
          }
        />
        <Input
          type='time'
          value={formatTimeForInput(date)}
          onChange={handleTimeChange}
          disabled={disabled}
          className='w-full'
        />
      </PopoverContent>
    </Popover>
  );
}
