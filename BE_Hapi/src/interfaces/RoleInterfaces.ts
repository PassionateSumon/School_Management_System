export interface CreateRolePayload {
  title: string;
  schoolId: string;
  priority: number;
}

export interface UpdateRolePayload {
  title?: string;
  priority?: number;
}
