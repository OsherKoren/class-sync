export type StudentClass = {
  classId: string;
  name: string;
  subject: string;
  type: string;
  level: string | null;
  grade: string | null;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  teacherName: string | null;
  enrollmentCount: number;
  maxCapacity: number | null;
};

export type ClassItem = {
  id: string;
  name: string;
  subject: string;
  type: string;
  level: string | null;
  grade: string | null;
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  duration: number;  // minutes
  enrollmentCount: number;
  maxCapacity: number | null;
};
