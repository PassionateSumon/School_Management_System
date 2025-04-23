export interface CreateEducationPayload {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  description?: string;
  certificate?: any;
}

export interface UpdateEducationPayload {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  certificate?: any;
}
