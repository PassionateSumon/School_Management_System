export interface GrantPermissionPayload {
  userId?: string;
  roleId?: string;
  moduleName: string;
  action: "read" | "write" | "delete" | "manage-all";
  targetType: "school" | "class" | "event";
  targetId: string;
  scope: "specific" | "all";
}
