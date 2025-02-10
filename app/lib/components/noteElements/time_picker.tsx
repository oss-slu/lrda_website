import * as React from "react";
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { Input } from "@/components/ui/input";

interface TimePickerProps {
  initialDate: Date;
  onTimeChange?: (date: Date) => void;
}

function formatDateTime(date: Date) {
  if (!date) return "Pick a date";
  return `${date.toDateString()}`;
}

export default function TimePicker({
  initialDate,
  onTimeChange,
}: TimePickerProps) {
  const [date, setDate] = useState(initialDate);

  useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  const formatTimeForInput = (date: Date) => {
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const handleDayClick = (newDay: Date) => {
    const updatedDate = new Date(date);
    updatedDate.setFullYear(
      newDay.getFullYear(),
      newDay.getMonth(),
      newDay.getDate()
    );
    setDate(updatedDate);
    onTimeChange && onTimeChange(updatedDate);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = event.target.value.split(":").map(Number);
    const updatedDate = new Date(date);
    updatedDate.setHours(hours, minutes);
    setDate(updatedDate);
    onTimeChange && onTimeChange(updatedDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex flex-row items-center justify-center w-[180px] group" // Add `group` here
          aria-label="Open Calendar"
          type="button"
        >
          <CalendarIcon className="mx-2 h-5 w-5 text-black group-hover:text-green-500" /> {/* Icon turns green on hover */}
          <span className="text-black group-hover:text-green-500">{formatDateTime(date)}</span> {/* Date text turns green on hover */}
        </button>
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
