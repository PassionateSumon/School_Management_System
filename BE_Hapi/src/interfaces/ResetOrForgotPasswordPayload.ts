export interface ResetOrForgotPasswordPayload {
  usernameOrEmail: string;
  newPassword: string;
  confirmPassword: string;
}
