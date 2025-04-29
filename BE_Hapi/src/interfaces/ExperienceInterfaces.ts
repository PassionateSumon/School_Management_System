export interface CreateExperiencePayload {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  certificate?: any;
}

export interface UpdateExperiencePayload {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  certificate?: any;
}
