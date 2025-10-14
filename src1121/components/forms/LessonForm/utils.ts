export const formatTime = (date: Date | string | undefined | null): string => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  };