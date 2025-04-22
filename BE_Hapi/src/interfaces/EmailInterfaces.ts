export interface EmailJob {
  to: string;
  subject: string;
  text: string;
}

export interface CreateInvitePayload {
  email: string;
  role: string;
  classId?: string;
  firstName: string;
  lastName?: string;
}