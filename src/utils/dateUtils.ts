export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatTime = (date: Date): string => {
  return date.toTimeString().slice(0, 5);
};

export const formatDateTime = (date: string, time: string): string => {
  const dateObj = new Date(`${date}T${time}`);
  return dateObj.toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const isDateAvailable = (date: string): boolean => {
  const today = new Date();
  const selectedDate = new Date(date);
  
  // Must be at least today or future
  if (selectedDate < today) return false;
  
  // Check if it's a valid business day (not Sunday)
  const dayOfWeek = selectedDate.getDay();
  return dayOfWeek !== 0; // Sunday = 0
};

export const getBusinessHours = () => {
  return {
    start: '09:00',
    end: '19:00',
    lunchBreak: { start: '13:00', end: '14:00' }
  };
};

export const generateDateRange = (startDate: Date, days: number): string[] => {
  const dates: string[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(formatDate(date));
  }
  
  return dates.filter(isDateAvailable);
};