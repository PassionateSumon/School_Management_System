export interface UserPermissionsQueryOrPayload {
  userId: string;
  targetType?: "school" | "class" | "event" | "notice";
  targetId?: string;
}

export interface RolePermissionsQueryOrPayload {
  roleId: string;
  targetType?: "school" | "class" | "event" | "notice";
  targetId?: string;
}

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}

export interface PermissionUpdate {
  moduleName: string;
  actions: string[];
}

export interface UpdateUserOrRolePermissionsPayload {
  userId?: string;
  roleId?: string;
  targetType: "school" | "class" | "event";
  targetId: string;
  permissions: PermissionUpdate[];
}