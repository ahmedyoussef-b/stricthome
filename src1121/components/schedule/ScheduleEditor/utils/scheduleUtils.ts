export const formatTimeSimple = (date: string | Date): string => {
    const d = new Date(date);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  };
  
  export const timeToMinutes = (time: string): number => {
    if (typeof time !== 'string' || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };