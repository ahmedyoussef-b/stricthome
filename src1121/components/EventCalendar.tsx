
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface EventCalendarProps {
  eventDates?: string[]; // Expecting ISO date strings (YYYY-MM-DD)
}

const EventCalendar = ({ eventDates = [] }: EventCalendarProps) => {
  const [value, onChange] = useState<Value>(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && value instanceof Date) {
      router.push(`?date=${value.toISOString().split('T')[0]}`);
    }
  }, [value, isMounted, router]);
  
  if (!isMounted) {
    return (
        <div className={cn("bg-card p-3 rounded-lg shadow-md")}>
            <Skeleton className="h-[250px] w-full" />
        </div>
    );
  }

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0];
      if (eventDates.includes(dateString)) {
        return 'event-day'; // Custom class for highlighting
      }
    }
    return null;
  };

  return (
    <div
      className={cn(
        "bg-card p-3 rounded-lg shadow-md",
        "transition-all duration-300 ease-in-out",
        "hover:shadow-xl hover:-translate-y-1"
      )}
    >
      <Calendar
        onChange={onChange}
        value={value}
        className="!border-none !font-sans"
        locale="fr-FR"
        tileClassName={tileClassName}
      />
    </div>
  );
};

export default EventCalendar;
