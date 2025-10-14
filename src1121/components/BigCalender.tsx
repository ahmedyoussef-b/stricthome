// src/components/BigCalender.tsx
"use client";

import { Calendar, momentLocalizer, View, Views, type NavigateAction, type Messages, type ToolbarProps, type DateLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/fr"; 
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useEffect, type FC } from "react";

const localizer = momentLocalizer(moment);

// Define the expected Event type
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
}

const CustomToolbar: FC<ToolbarProps<CalendarEvent, object>> = ({ label, onView, views, view: currentView }) => {

  // Textes directement en français
  const weekText = "Semaine";
  const dayText = "Jour";

  return (
    <div className="rbc-toolbar flex justify-between items-center p-2 mb-3 border-b pb-2">
      <div className="rbc-toolbar-label text-lg font-semibold text-foreground">
        {label}
      </div>
      <div className="rbc-btn-group space-x-1">
        {(views as View[]).map(viewOption => {
          if (viewOption === Views.WEEK || viewOption === Views.DAY) { 
            const isActive = currentView === viewOption;
            let buttonText = '';
            if (viewOption === Views.WEEK) buttonText = weekText;
            if (viewOption === Views.DAY) buttonText = dayText;
            
            return (
              <button
                key={viewOption}
                type="button"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                            ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                onClick={() => onView(viewOption)}
              >
                {buttonText}
              </button>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};


const BigCalendar = ({
  data,
}: {
  data: { title: string; start: Date; end: Date }[];
}) => {
  const [view, setView] = useState<View>(Views.WEEK);

  useEffect(() => {
    moment.locale('fr'); // Définir la locale de moment à 'fr'
  }, []);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  // Textes de messages directement en français
  const messages: Messages = {
    week: "Semaine",
    day: "Jour",
    agenda: "Agenda",
    date: "Date",
    time: "Heure",
    event: "Événement",
    noEventsInRange: "Aucun événement dans cette période.",
    showMore: (total: number) => `+${total} de plus`,
    // Les clés "today", "previous", "next" ne sont plus utilisées par CustomToolbar
  };

  return (
    <Calendar
      localizer={localizer}
      events={data}
      startAccessor="start"
      endAccessor="end"
      views={[Views.WEEK, Views.DAY]} 
      view={view}
      culture={'fr'} // Culture fixe
      style={{ height: "98%" }}
      onView={handleOnChangeView}
      min={new Date(0, 0, 0, 8, 0, 0)} 
      max={new Date(0, 0, 0, 18, 0, 0)} 
      defaultDate={new Date()}
      components={{
        toolbar: CustomToolbar,
      }}
      messages={messages}
      formats={{
        dayFormat: (date: Date, culture: string | undefined, localizer?: DateLocalizer) =>
          localizer ? localizer.format(date, 'dddd', culture) : date.toLocaleDateString(), 
        weekdayFormat: (date: Date, culture: string | undefined, localizer?: DateLocalizer) =>
          localizer ? localizer.format(date, 'ddd', culture) : date.toLocaleDateString(),
        dayHeaderFormat: (date: Date, culture: string | undefined, localizer?: DateLocalizer) =>
          localizer ? localizer.format(date, 'dddd, D MMM', culture) : date.toLocaleDateString(), // Format français
      }}
    />
  );
};

export default BigCalendar;
