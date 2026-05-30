import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/utils/data_conversion';

const START_MONTH = new Date(1200, 0);
const END_MONTH = new Date(new Date().getFullYear(), 11);

interface TimePickerProps {
  date: Date;
  onTimeChange: (date: Date) => void;
  disabled?: boolean;
}

export default function TimePicker({
  date,
  onTimeChange,
  disabled = false,
}: TimePickerProps) {
  const [viewMonth, setViewMonth] = useState(() => date);

  const formatTimeForInput = (d: Date) => {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleDayClick = (newDay: Date) => {
    const updatedDate = new Date(date);
    updatedDate.setFullYear(newDay.getFullYear(), newDay.getMonth(), newDay.getDate());
    onTimeChange(updatedDate);
    setViewMonth(newDay);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const parts = event.target.value.split(':').map(Number);
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    const updatedDate = new Date(date);
    updatedDate.setHours(hours, minutes);
    onTimeChange(updatedDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          disabled={disabled}
          className={`group inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
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
          captionLayout='dropdown'
          startMonth={START_MONTH}
          endMonth={END_MONTH}
          autoFocus
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
