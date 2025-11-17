import * as React from "react";
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { CaptionProps } from "react-day-picker";

interface TimePickerProps {
  initialDate?: Date; // Now optional — will fall back to today if not provided
  onTimeChange?: (date: Date) => void;
}

function formatDateTime(date: Date) {
  if (!date) return "Pick a date";
  return `${date.toDateString()}`;
}

type CustomCaptionProps = CaptionProps & {
  onMonthChange?: (date: Date) => void;
  onDayClick?: (date: Date) => void;
};

function CaptionDropdowns({
  calendarMonth,
  onMonthChange,
  onDayClick,
}: CustomCaptionProps) {
  const fromYear = 1200;
  const toYear = new Date().getFullYear();

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("default", { month: "long" })
  );
  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);

  const displayMonth = calendarMonth?.date || new Date();

  const handleChange = (newMonth: number, newYear: number) => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(newMonth);
    newDate.setFullYear(newYear);
    newDate.setDate(1);
    onMonthChange?.(newDate);
    onDayClick?.(newDate);
  };

  return (
    <div className="flex space-x-2 px-3 py-2">
      <select
        className="text-sm px-2 py-1 border rounded-md"
        value={displayMonth.getMonth()}
        onChange={(e) =>
          handleChange(parseInt(e.target.value), displayMonth.getFullYear())
        }
      >
        {months.map((month, idx) => (
          <option key={idx} value={idx}>
            {month}
          </option>
        ))}
      </select>
      <select
        className="text-sm px-2 py-1 border rounded-md"
        value={displayMonth.getFullYear()}
        onChange={(e) =>
          handleChange(displayMonth.getMonth(), parseInt(e.target.value))
        }
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function TimePicker({ initialDate, onTimeChange }: TimePickerProps) {
  const now = new Date();
  const [date, setDate] = useState(initialDate || now);
  const [viewMonth, setViewMonth] = useState(initialDate || now);

  useEffect(() => {
    const fallbackDate = initialDate || new Date();
    setDate(fallbackDate);
    setViewMonth(fallbackDate);
  }, [initialDate]);

  const formatTimeForInput = (date: Date) => {
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const handleDayClick = (newDay: Date) => {
    const updatedDate = new Date(date);
    updatedDate.setFullYear(newDay.getFullYear(), newDay.getMonth(), newDay.getDate());
    setDate(updatedDate);
    onTimeChange?.(updatedDate);
    setViewMonth(newDay);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = event.target.value.split(":").map(Number);
    const updatedDate = new Date(date);
    updatedDate.setHours(hours, minutes);
    setDate(updatedDate);
    onTimeChange?.(updatedDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors group"
          aria-label="Open Calendar"
          type="button"
        >
          <CalendarIcon className="h-4 w-4 text-gray-700 group-hover:text-blue-600" />
          <span className="text-gray-700 group-hover:text-gray-900">
            {formatDateTime(date)}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-4 bg-white shadow-lg z-30 rounded-md space-y-2">
        <Calendar
          mode="single"
          selected={date}
          onDayClick={handleDayClick}
          month={viewMonth}
          onMonthChange={setViewMonth}
          initialFocus
          {...({
            components: {
              Caption: (props: any) => (
                <CaptionDropdowns
                  {...props}
                  onMonthChange={setViewMonth}
                  onDayClick={handleDayClick}
                />
              ),
            },
          } as any)}
        />
        <Input
          type="time"
          value={formatTimeForInput(date)}
          onChange={handleTimeChange}
          className="w-full"
        />
      </PopoverContent>
    </Popover>
  );
}
