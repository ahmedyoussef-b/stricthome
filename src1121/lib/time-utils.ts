import { Day } from "@prisma/client";

export const formatTimeSimple = (date: string | Date): string => {
    const d = new Date(date);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
};

export const timeToMinutes = (time: string): number => {
    if (typeof time !== 'string' || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export const generateTimeSlots = (startTime: string, endTime: string, sessionDuration: number): string[] => {
    const slots: string[] = [];
    if (!startTime || !endTime || !sessionDuration) return [];

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    const lunchStartMinutes = 12 * 60;
    const lunchEndMinutes = 14 * 60; // Lunch break from 12:00 to 14:00 (2 hours)

    let currentMinute = startTotalMinutes;
    
    while (currentMinute < endTotalMinutes) {
        const slotEndMinute = currentMinute + sessionDuration;
        
        // Skip the lunch break entirely.
        if (currentMinute >= lunchStartMinutes && currentMinute < lunchEndMinutes) {
            currentMinute = lunchEndMinutes;
            continue;
        }

        if (slotEndMinute <= endTotalMinutes) {
            const h = Math.floor(currentMinute / 60);
            const m = currentMinute % 60;
            slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
        
        currentMinute += sessionDuration;
    }

    return slots;
};

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export const dayMapping: { [key in Day]: DayOfWeek } = {
    MONDAY: DayOfWeek.MONDAY,
    TUESDAY: DayOfWeek.TUESDAY,
    WEDNESDAY: DayOfWeek.WEDNESDAY,
    THURSDAY: DayOfWeek.THURSDAY,
    FRIDAY: DayOfWeek.FRIDAY,
    SATURDAY: DayOfWeek.SATURDAY,
    SUNDAY: DayOfWeek.SUNDAY,
};
