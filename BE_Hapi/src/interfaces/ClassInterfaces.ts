export interface ClassCreatePayload {
  teacherName: string;
  subjectName: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ClassScheduleUpdatePayload {
  teacherName?: string;
  subjectName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}
