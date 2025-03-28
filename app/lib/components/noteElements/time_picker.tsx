import * as React from "react";
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CaptionProps } from "react-day-picker";

interface TimePickerProps {
  initialDate: Date;
  onTimeChange?: (date: Date) => void;
}

function formatDateTime(date: Date) {
  if (!date) return "Pick a date";
  return `${date.toDateString()}`;
}

// --- Custom Caption Component for Inline Month & Year Dropdowns ---
function CaptionDropdowns({
  displayMonth,
  onMonthChange,
  onDayClick,
}: CaptionProps & { onDayClick?: (date: Date) => void }) {
  const fromYear = 1200;
  const toYear = new Date().getFullYear();

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("default", { month: "long" })
  );

  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);

  const handleChange = (newMonth: number, newYear: number) => {
    const newDate = new Date(displayMonth);
    newDate.setMonth(newMonth);
    newDate.setFullYear(newYear);
    newDate.setDate(1);
    onMonthChange?.(newDate);
    onDayClick?.(newDate); // This will update selected date
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

// --- Main TimePicker Component ---
export default function TimePicker({ initialDate, onTimeChange }: TimePickerProps) {
  const [date, setDate] = useState(initialDate);
  const [viewMonth, setViewMonth] = useState(initialDate);

  useEffect(() => {
    setDate(initialDate);
    setViewMonth(initialDate);
  }, [initialDate]);

  const formatTimeForInput = (date: Date) => {
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const CaptionWithDayClick = (
    props: CaptionProps & { onDayClick?: (date: Date) => void }
  ) => <CaptionDropdowns {...props} onDayClick={props.onDayClick} />;
  

  const handleDayClick = (newDay: Date) => {
    const updatedDate = new Date(date);
    updatedDate.setFullYear(newDay.getFullYear(), newDay.getMonth(), newDay.getDate());
    setDate(updatedDate);
    onTimeChange?.(updatedDate);
    setViewMonth(newDay); // Sync visible month
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
          className="flex flex-row items-center justify-center w-[200px] group"
          aria-label="Open Calendar"
          type="button"
        >
          <CalendarIcon className="mx-2 h-5 w-5 text-black group-hover:text-green-500" />
          <span className="text-black group-hover:text-green-500">
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
          components={{
            Caption: (props) => (
              <CaptionDropdowns {...props} onDayClick={handleDayClick} />
            ),
          }}
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
