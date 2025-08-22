import { Subject, AttendanceStatus } from '@/types';

export const calculatePercentage = (attended: number, total: number): number => {
  return total > 0 ? (attended / total) * 100 : 0;
};

export const getAttendanceStatus = (
  currentPercentage: number,
  goal: number,
  attended: number,
  total: number,
  semesterEndDate: string
): AttendanceStatus => {
  if (currentPercentage >= goal) return 'safe';
  
  const remainingDays = getRemainingWorkingDays(semesterEndDate);
  const maxPossibleAttended = attended + remainingDays;
  const maxPossibleTotal = total + remainingDays;
  const maxPossiblePercentage = calculatePercentage(maxPossibleAttended, maxPossibleTotal);
  
  return maxPossiblePercentage >= goal ? 'warning' : 'danger';
};

export const calculateRequiredClasses = (
  attended: number,
  total: number,
  goal: number
): number => {
  // Calculate minimum classes needed to reach goal
  // Formula: (attended + x) / (total + x) >= goal/100
  // Solving: x >= (goal * total - 100 * attended) / (100 - goal)
  const numerator = (goal * total) - (100 * attended);
  const denominator = 100 - goal;
  
  if (denominator <= 0) return 0;
  return Math.max(0, Math.ceil(numerator / denominator));
};

export const calculateBunkingBuffer = (
  attended: number,
  total: number,
  goal: number
): number => {
  // Calculate maximum classes that can be missed while maintaining goal
  // Formula: attended / (total + x) >= goal/100
  // Solving: x <= (100 * attended - goal * total) / goal
  const numerator = (100 * attended) - (goal * total);
  
  if (goal <= 0 || numerator <= 0) return 0;
  return Math.floor(numerator / goal);
};

export const getHolidays = (): Date[] => {
  const currentYear = new Date().getFullYear();
  return [
    new Date(currentYear, 0, 1),   // New Year
    new Date(currentYear, 0, 26),  // Republic Day
    new Date(currentYear, 7, 15),  // Independence Day
    new Date(currentYear, 9, 2),   // Gandhi Jayanti
    new Date(currentYear, 11, 25), // Christmas
  ];
};

export const isThirdSaturday = (date: Date): boolean => {
  if (date.getDay() !== 6) return false; // Not Saturday
  
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstSaturday = 7 - firstDay.getDay();
  const thirdSaturday = firstSaturday + 14;
  
  return date.getDate() === thirdSaturday;
};

export const isWorkingDay = (date: Date): boolean => {
  const holidays = getHolidays();
  const isHoliday = holidays.some(holiday => 
    holiday.toDateString() === date.toDateString()
  );
  
  return !isHoliday && !isThirdSaturday(date) && date.getDay() !== 0; // Not Sunday
};

export const getRemainingWorkingDays = (semesterEndDate: string): number => {
  const today = new Date();
  const endDate = new Date(semesterEndDate);
  let count = 0;
  
  for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (isWorkingDay(d)) count++;
  }
  
  return count;
};

export const getStatusColor = (status: AttendanceStatus): string => {
  switch (status) {
    case 'safe': return 'bg-green-100 border-green-500 text-green-800';
    case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    case 'danger': return 'bg-red-100 border-red-500 text-red-800';
  }
};

export const saveToLocalStorage = (key: string, data: any): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

export const loadFromLocalStorage = (key: string): any => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  return null;
};