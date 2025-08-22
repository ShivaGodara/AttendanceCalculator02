export interface Subject {
  id: string;
  name: string;
  attended: number;
  total: number;
  goal: number;
}

export interface Settings {
  individualGoal: number;
  aggregateGoal: number;
  semesterEndDate: string;
}

export interface TimetableEntry {
  day: string;
  subjects: string[];
}

export interface LeaveCount {
  cocurricular: number;
  medical: number;
}

export interface AppData {
  subjects: Subject[];
  settings: Settings;
  timetable: TimetableEntry[];
}

export type AttendanceStatus = 'safe' | 'warning' | 'danger';