export interface GrantPermissionPayload {
  userId?: string;
  roleId?: string;
  moduleName: string;
  action: "read" | "write" | "delete" | "manage-all";
  targetType: "school" | "class" | "event";
  targetId: string;
  scope: "specific" | "all";
}

type actions = "read" | "write" | "delete" | "manage-all";
export interface CreatePermissionPayload {
  userId?: string;
  roleId?: string;
  moduleName: string;
  action: actions[];
  targetType: "school" | "class" ;
  scope: "specific" | "all";
}