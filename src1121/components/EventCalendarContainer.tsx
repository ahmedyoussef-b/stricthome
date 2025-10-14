// src/components/EventCalendarContainer.tsx
'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import type { Event } from "@/types/index";
import { MoreHorizontal } from "lucide-react";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface EventCalendarContainerProps {
  date?: string | string[] | undefined;
  events: Event[];
  eventDates: string[];
}

const EventCalendarContainer = ({ date, events = [], eventDates = [] }: EventCalendarContainerProps) => {
  const [value, onChange] = useState<Value>(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const selectedDateParam = Array.isArray(date) ? date[0] : date;
  
  useEffect(() => {
    setIsMounted(true);
    if(selectedDateParam) {
        const initialDate = new Date(selectedDateParam);
        // Adjust for timezone offset to prevent day-off errors
        initialDate.setMinutes(initialDate.getMinutes() + initialDate.getTimezoneOffset());
        onChange(initialDate);
    }
  }, []);

  useEffect(() => {
    if (isMounted && value instanceof Date) {
      const newDateString = value.toISOString().split('T')[0];
      if (newDateString !== selectedDateParam) {
        router.push(`?date=${newDateString}`);
      }
    }
  }, [value, isMounted, router, selectedDateParam]);

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
  
  const eventsForDay = events.filter(event => {
      const eventDate = new Date(event.startTime);
      const selectedValue = value instanceof Date ? value : value?.[0];
      return selectedValue && eventDate.toDateString() === selectedValue.toDateString();
  });

  return (
    <div className="bg-muted p-4 rounded-md">
      <Calendar
        onChange={onChange}
        value={value}
        className="!border-none !font-sans"
        locale="fr-FR"
        tileClassName={tileClassName}
      />
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-xl font-semibold">Événements du jour</h1>
        <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-4 mt-2">
        {eventsForDay.length > 0 ? (
          eventsForDay.map((event) => (
            <div
              className="p-3 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple bg-card"
              key={event.id}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{event.title}</h2>
                <span className="text-muted-foreground text-xs">
                  {new Date(event.startTime).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground text-sm">{event.description}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-center text-muted-foreground py-4">
            Aucun événement pour cette date.
          </p>
        )}
      </div>
    </div>
  );
};

export default EventCalendarContainer;
