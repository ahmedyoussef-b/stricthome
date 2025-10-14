// src/components/dashboard/admin/AdminSidebar.tsx
import prisma from "@/lib/prisma";
import Announcements from "@/components/Announcements";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import { type AnnouncementWithClass, type Event } from "@/types";

interface AdminSidebarProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// Data fetching is now co-located with the component that uses it.
async function getSidebarData() {
    console.log("👑 [AdminSidebar] Récupération des annonces et des événements depuis Prisma.");
    const announcements: AnnouncementWithClass[] = (await prisma.announcement.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
            class: { select: { name: true } },
        },
    })).map(a => ({...a, date: a.date.toISOString()})) as unknown as AnnouncementWithClass[];


    const events: Event[] = (await prisma.event.findMany({
        orderBy: { startTime: 'asc' },
    })).map(e => ({...e, startTime: e.startTime.toISOString(), endTime: e.endTime.toISOString()})) as unknown as Event[];
    
    // Data is serialized here before being passed to client components if necessary
    return {
        announcements,
        events,
    };
}


const AdminSidebar = async ({ searchParams }: AdminSidebarProps) => {
    const { announcements, events } = await getSidebarData();
    const eventDates = events.map((event) => new Date(event.startTime).toISOString().split('T')[0]);
    const uniqueEventDates = [...new Set(eventDates)] as string[];
    
    return (
        <>
            <EventCalendarContainer 
                date={searchParams.date}
                events={events} // Pass events directly
                eventDates={uniqueEventDates} // Pass dates for highlighting
            />
            <div className="flex-1 min-h-0">
                <Announcements initialAnnouncements={announcements} />
            </div>
        </>
    );
};

export default AdminSidebar;
