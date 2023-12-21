import * as React from 'react';
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Input } from '@/components/ui/input';

interface TimePickerProps {
  initialDate: Date;
}

function formatDateTime(date: Date) {
  if (!date) return 'Pick a date';

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const ampm = hours < 12 ? 'AM' : 'PM';

  return `${date.toDateString()} ${formattedHours}:${formattedMinutes} ${ampm}`;
}

export default function TimePicker({ initialDate }: TimePickerProps) {
  const [date, setDate] = useState(initialDate);

  useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  const formatTimeForInput = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleDayClick = (newDay: Date) => {
    const updatedDate = new Date(date);
    updatedDate.setFullYear(newDay.getFullYear(), newDay.getMonth(), newDay.getDate());
    setDate(updatedDate);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = event.target.value.split(':').map(Number);
    const updatedDate = new Date(date);
    updatedDate.setHours(hours, minutes);
    setDate(updatedDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-[280px] justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateTime(date)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white shadow-lg z-30">
        <Calendar mode="single" selected={date} onDayClick={handleDayClick} />
        <Input
          type="time"
          value={formatTimeForInput(date)}
          onChange={handleTimeChange}
        />
      </PopoverContent>
    </Popover>
  );
}
