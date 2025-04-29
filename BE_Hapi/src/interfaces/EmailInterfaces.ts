export interface EmailJob {
  to: string;
  subject: string;
  text: string;
}

export interface CreateInvitePayload {
  email: string;
  role: string;
  className?: string;
  firstName: string;
  lastName?: string;
  priority?: number
}