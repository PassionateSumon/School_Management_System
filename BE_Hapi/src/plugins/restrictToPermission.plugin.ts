import { Op } from "sequelize";
import type { Request, ResponseToolkit } from "@hapi/hapi";
import { Permission } from "../models/Permission.model";
import { User } from "../models/User.model";
import { Role } from "../models/Role.model";
import { error } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { sequelize } from "../db/db";
import { JWTUtil } from "../utils/jwtAll.util";
import { Module } from "../models/Module.model";

interface PermissionCheck {
  request: Request;
  userId: string;
  targetId?: string;
}

export const restrictToPermission = {
  name: "restrictToPermissionPlugin",
  register: async (server: any) => {
    server.ext("onPreAuth", async (request: Request, h: ResponseToolkit) => {
      const { payload, state, route, headers } = request;
      const accessToken = state.accessToken;

      // Validate access token
      const decoded = JWTUtil.verifyAccessToken(accessToken);
      if (!decoded) {
        return error(null, "Invalid access token", statusCodes.UNAUTHORIZED)(h);
      }

      // Validate user
      const user = await User.findOne({ where: { id: decoded.id }, include: [{ model: Role }] }) as any;
      if (!user || !user.isActive) {
        return error(null, "User not found or inactive", statusCodes.NOT_FOUND)(h);
      }

      // Bypass for super_admin
      if (user.role?.title.toLowerCase() === "super_admin") {
        return h.continue;
      }

      // Infer moduleName from payload or path
      const pathSegments = route.path.split("/").filter(segment => segment);
      let moduleName = pathSegments[1] ? pathSegments[1].toLowerCase() : null;
      if ((payload as any)?.module) {
        moduleName = (payload as any).module.toLowerCase();
      }
      if (!moduleName) {
        return error(null, "Cannot infer module from route path or payload", statusCodes.BAD_REQUEST)(h);
      }

      // Resolve moduleId
      const moduleRecord = await Module.findOne({
        where: { name: moduleName, schoolId: user.schoolId },
      }) as any;
      if (!moduleRecord) {
        return error(null, `Invalid module: ${moduleName}`, statusCodes.BAD_REQUEST)(h);
      }
      const moduleId = moduleRecord.id;

      // Infer action from payload, headers, or method
      let action: string;
      if ((payload as any)?.action) {
        action = (payload as any).action.toLowerCase();
      } else if (headers['x-action']) {
        action = headers['x-action'].toLowerCase();
      } else {
        switch (route.method.toLowerCase()) {
          case "post":
            action = "create";
            break;
          case "put":
            action = "update";
            break;
          case "get":
            action = "read";
            break;
          case "delete":
            action = "delete";
            break;
          default:
            return error(null, `Unsupported HTTP method: ${route.method}`, statusCodes.BAD_REQUEST)(h);
        }
      }

      // Validate action
      const validActions = await Permission.findAll({
        attributes: [[sequelize.fn("DISTINCT", sequelize.col("action")), "action"]],
        raw: true,
      }).then(results => results.map((r: any) => r.action));
      if (!validActions.includes(action) && !validActions.includes("manage-all")) {
        return error(null, `Invalid action: ${action}`, statusCodes.BAD_REQUEST)(h);
      }

      // Infer targetType from payload or params
      let targetType: string | null = null;
      const params = request.params;
      if ((payload as any)?.classId || params?.classId) {
        targetType = "class";
      } else if ((payload as any)?.schoolId || params?.schoolId) {
        targetType = "school";
      } else if ((payload as any)?.inviteId || params?.inviteId || params?.token) {
        targetType = "invite";
      } else if ((payload as any)?.assignmentId || params?.assignmentId) {
        targetType = "assignment";
      } else if ((payload as any)?.examScheduleId || params?.examScheduleId) {
        targetType = "examschedule";
      } else if ((payload as any)?.attendanceId || params?.attendanceId) {
        targetType = "attendance";
      } else if ((payload as any)?.resultId || params?.resultId) {
        targetType = "result";
      } else {
        targetType = moduleName; // Fallback to moduleName
      }

      // Validate targetType
      const validTargetTypes = await Permission.findAll({
        attributes: [[sequelize.fn("DISTINCT", sequelize.col("targetType")), "targetType"]],
        raw: true,
      }).then((results: any) => results.map((r: any) => r.targetType));
      if (!validTargetTypes.includes(targetType)) {
        return error(null, `Invalid targetType: ${targetType}`, statusCodes.BAD_REQUEST)(h);
      }

      // Infer targetId
      let effectiveTargetId: string | undefined = undefined;
      effectiveTargetId =
        (payload as any)?.classId ||
        params?.classId ||
        (payload as any)?.schoolId ||
        params?.schoolId ||
        (payload as any)?.inviteId ||
        params?.inviteId ||
        params?.token ||
        (payload as any)?.assignmentId ||
        params?.assignmentId ||
        (payload as any)?.examScheduleId ||
        params?.examScheduleId ||
        (payload as any)?.attendanceId ||
        params?.attendanceId ||
        (payload as any)?.resultId ||
        params?.resultId;
      if (!effectiveTargetId && targetType === "school") {
        effectiveTargetId = user.schoolId;
      }
      if (!effectiveTargetId && targetType !== "school") {
        return error(null, `Target ID required for targetType: ${targetType}`, statusCodes.BAD_REQUEST)(h);
      }

      // Check permissions
      const conditions: any = [
        {
          [Op.or]: [
            { userId: user.id, scope: "specific" },
            user.roleId ? { roleId: user.roleId, scope: "all" } : {},
          ],
          moduleId,
          action: { [Op.in]: [action, "manage-all"] },
          targetType,
        },
      ];

      if (effectiveTargetId) {
        conditions.push({ targetId: { [Op.or]: [effectiveTargetId, null] } });
      } else {
        conditions.push({ targetId: null });
      }

      const permission = await Permission.findOne({
        where: { [Op.and]: conditions },
      });

      if (!permission) {
        return error(null, `No permission to perform ${action} on module ${moduleName}/${targetType}`, statusCodes.PERMISSION_DENIED)(h);
      }

      return h.continue;
    });
  },
};

// export const restrictToPermission = async ({
//   request,
//   userId,
//   targetId,
// }: PermissionCheck) => {
//   // Fetch user with role
//   const user = await User.findByPk(userId, { include: [{ model: Role }] }) as any;
//   if (!user || !user.role) {
//     throw new Error("User or role not found");
//   }

//   // Bypass for super_admin
//   if (user.role.title.toLowerCase() === "super_admin") {
//     return true;
//   }

//   // Derive permission requirements
//   const { path, method, settings } = request.route;
//   const payload = request.payload as any;

//   // Infer module from path (e.g., "/invites/*" -> "invite")
//   const pathSegments = path
//     .split("/")
//     .filter((segment) => segment && !segment.includes("{"));
//   const module = pathSegments[1]?.toLowerCase() || "generic";

//   // Infer action from method and path
//   const actionMap: { [key: string]: string } = {
//     POST: "create",
//     GET: "read",
//     PUT: "update",
//     PATCH: "update",
//     DELETE: "delete",
//   };
//   let action = actionMap[method.toUpperCase()] || "access";
//   if (path.includes("resend")) {
//     action = "resend";
//   } else if (path.includes("accept") || path.includes("reject")) {
//     action = "manage";
//   }

//   // Infer targetType from payload, route options, or path
//   let targetType = (settings as any).permissions?.targetType || "generic";
//   if (payload?.classId) {
//     targetType = "class";
//   } else if (payload?.schoolId || user.schoolId) {
//     targetType = "school";
//   } else if (path.includes("user")) {
//     targetType = "user";
//   }

//   // Use provided targetId or infer
//   const effectiveTargetId =
//     targetId || payload?.classId || payload?.schoolId || user.schoolId;

//   // Hierarchy check for targetType: "user"
//   if (targetType === "user" && effectiveTargetId) {
//     const targetUser = await User.findByPk(effectiveTargetId, {
//       include: [{ model: Role }],
//     }) as any;
//     if (!targetUser || !targetUser.role) {
//       throw new Error("Target user or role not found");
//     }

//     const actorPriority = user.role.priority || 999;
//     const targetPriority = targetUser.role.priority || 999;

//     if (targetPriority < actorPriority) {
//       throw new Error("Cannot perform action on a higher-authorized role");
//     }
//   }

//   // Check permissions
//   const conditions: any = [
//     {
//       [Op.or]: [
//         { userId: user.id, scope: "specific" },
//         { roleId: user.roleId, scope: "all" },
//       ],
//       module,
//       action: { [Op.in]: [action, "manage-all"] },
//       targetType,
//     },
//   ];

//   if (effectiveTargetId) {
//     conditions.push({ targetId: { [Op.or]: [effectiveTargetId, null] } });
//   } else {
//     conditions.push({ targetId: null });
//   }

//   const permission = await Permission.findOne({
//     where: { [Op.and]: conditions },
//   });

//   if (!permission) {
//     throw new Error(
//       `No permission to perform ${action} on ${module}/${targetType}`
//     );
//   }

//   return true;
// };

// import type { Request, ResponseToolkit } from "@hapi/hapi";
// import { Op } from "sequelize";
// import { JWTUtil } from "../utils/jwtAll.util";
// import { error } from "../utils/returnFunctions.util";
// import { statusCodes } from "../config/constants";
// import { User } from "../models/User.model";
// import { Module } from "../models/Module.model";
// import { Permission } from "../models/Permission.model";
// import type {
//   PermissionUpdate,
//   UpdateUserOrRolePermissionsPayload,
// } from "../interfaces/PermissionInterfaces";
// import { Role } from "../models/Role.model";

// export const restrictToPermissionPlugin = {
//   name: "restrictToPermissionPlugin",
//   register: async (server: any) => {
//     server.ext("onPreAuth", async (request: Request, h: ResponseToolkit) => {
//       const { payload, route } = request;
//       const accessToken =
//         request.state.accessToken ||
//         request.headers.authorization?.split(" ")[1];

//       // 1. Validate access token
//       if (!accessToken) {
//         return error(
//           null,
//           "Access token required",
//           statusCodes.UNAUTHORIZED
//         )(h);
//       }

//       const decoded = JWTUtil.verifyAccessToken(accessToken);
//       if (!decoded) {
//         return error(
//           null,
//           "Invalid or expired access token",
//           statusCodes.UNAUTHORIZED
//         )(h);
//       }

//       // 2. Validate user and fetch role
//       const user = (await User.findOne({
//         where: { id: decoded.id },
//         include: [{ model: Role, as: "role" }],
//       })) as any;
//       if (!user || !user.isActive) {
//         return error(
//           null,
//           "User not found or inactive",
//           statusCodes.NOT_FOUND
//         )(h);
//       }

//       // 3. Check for super_admin role
//       const isSuperAdmin =
//         user.role?.title.toLowerCase() === "super_admin" ||
//         user.role?.priority >= 1000;
//       if (isSuperAdmin) {
//         return h.continue; // Super admin bypasses all permission checks
//       }

//       // 4. Extract required permissions from payload or route
//       let requiredPermissions: { moduleName: string; actions: string[] }[] = [];
//       let targetType: string | undefined;
//       let targetId: string | undefined;

//       if (payload && "permissions" in (payload as any)) {
//         const {
//           permissions,
//           targetType: payloadTargetType,
//           targetId: payloadTargetId,
//         } = payload as UpdateUserOrRolePermissionsPayload;
//         if (!permissions || !Array.isArray(permissions)) {
//           return error(
//             null,
//             "Permissions array required",
//             statusCodes.BAD_REQUEST
//           )(h);
//         }
//         requiredPermissions = permissions.map((perm: PermissionUpdate) => ({
//           moduleName: perm.moduleName,
//           actions: perm.actions,
//         }));
//         targetType = payloadTargetType;
//         targetId = payloadTargetId;
//       } else {
//         // Fallback to route settings
//         const routePermissions =
//           (route as any).settings?.plugins?.permissions || [];
//         requiredPermissions = routePermissions.map((perm: any) => ({
//           moduleName: perm.module,
//           actions: Array.isArray(perm.action) ? perm.action : [perm.action],
//         }));
//         targetType = (route as any).settings?.plugins?.targetType;
//         targetId = (route as any).settings?.plugins?.targetId;
//       }

//       if (!requiredPermissions.length) {
//         return error(
//           null,
//           "No permissions specified for this action",
//           statusCodes.BAD_REQUEST
//         )(h);
//       }

//       // 5. Validate permissions for each required module
//       for (const { moduleName, actions } of requiredPermissions) {
//         // Fetch module
//         const module = (await Module.findOne({
//           where: { name: moduleName },
//         })) as any;
//         if (!module) {
//           return error(
//             null,
//             `Module '${moduleName}' not found`,
//             statusCodes.NOT_FOUND
//           )(h);
//         }

//         // Fetch all permissions for the user (user-specific or role-based) for this module
//         const permissionQuery: any = {
//           moduleId: module.id,
//           action: { [Op.in]: actions }, // Check if any required action is present
//           [Op.or]: [
//             { userId: user.id, scope: "specific" },
//             user.roleId ? { roleId: user.roleId, scope: "all" } : {},
//           ],
//         };

//         // Add target-specific conditions if provided
//         if (targetType && targetId) {
//           permissionQuery.targetType = targetType;
//           permissionQuery.targetId = targetId;
//         }

//         const userPermissions = await Permission.findAll({
//           where: permissionQuery,
//           attributes: ["action", "targetType", "targetId", "scope"],
//         });

//         // Check if all required actions are covered by user’s permissions
//         const permittedActions = userPermissions.map(
//           (perm: any) => perm.action
//         );
//         const missingActions = actions.filter(
//           (action) => !permittedActions.includes(action)
//         );
//         if (missingActions.length > 0) {
//           return error(
//             null,
//             `Permission denied for actions '${missingActions.join(
//               ", "
//             )}' on module '${moduleName}'`,
//             statusCodes.PERMISSION_DENIED
//           )(h);
//         }

//         // 6. Hierarchical access control for target-specific requests
//         if (targetType && targetId) {
//           const targetPermissions = (await Permission.findAll({
//             where: { targetType, targetId },
//             include: [
//               {
//                 model: User,
//                 as: "recipient",
//                 include: [{ model: Role, as: "role" }],
//               },
//               { model: Role, as: "role" },
//             ],
//           })) as any;

//           const userPriority = user.role?.priority || 1;
//           for (const targetPermission of targetPermissions) {
//             const targetUser = targetPermission.recipient;
//             const targetRole = targetPermission.role || targetUser?.role;

//             const targetPriority = targetRole?.priority || 1;
//             if (targetPriority > userPriority) {
//               return error(
//                 null,
//                 "Cannot access data of higher-authorized user",
//                 statusCodes.PERMISSION_DENIED
//               )(h);
//             }
//           }
//         }
//       }

//       // 7. Allow public data access if specified
//       const isPublicDataRequest =
//         (route as any).settings?.plugins?.isPublic || false;
//       if (isPublicDataRequest) {
//         return h.continue; // Allow access to public data
//       }

//       return h.continue; // All permissions validated
//     });
//   },
// };

// export const restrictToPermissionPlugin = {
//   name: "restrictToPermissionPlugin",
//   register: async (server: any) => {
//     server.ext("onPreAuth", async (request: Request, h: ResponseToolkit) => {
//       const { payload } = request;
//       const accessToken = request.state.accessToken;

//       // Validate access token
//       const decoded = JWTUtil.verifyAccessToken(accessToken);
//       if (!decoded) {
//         return error(null, "Invalid access token", statusCodes.UNAUTHORIZED)(h);
//       }

//       // Validate user
//       const user = await User.findOne({ where: { id: decoded.id } }) as any;
//       if (!user || !user.isActive) {
//         return error(
//           null,
//           "User not found or inactive",
//           statusCodes.NOT_FOUND
//         )(h);
//       }

//       // Validate payload permissions
//       const { permissions, targetType, targetId } =
//         payload as UpdateUserOrRolePermissionsPayload;
//       if (!permissions || !Array.isArray(permissions)) {
//         return error(null, "Permissions required", statusCodes.BAD_REQUEST)(h);
//       }

//       // Collect required moduleNames and actions
//       const requiredPermissions = permissions.flatMap(
//         (perm: PermissionUpdate) =>
//           perm.actions.map((action: string) => ({
//             moduleName: perm.moduleName,
//             action,
//           }))
//       );

//       // Check for any matching permission
//       for (const { moduleName, action } of requiredPermissions) {
//         const module = await Module.findOne({ where: { name: moduleName } }) as any;
//         if (!module) {
//           continue; // Skip if module not found
//         }

//         const hasPermission = await Permission.findOne({
//           where: {
//             [Op.or]: [
//               { userId: user.id, scope: "specific" },
//               user.roleId ? { roleId: user.roleId, scope: "all" } : {}, // Use single roleId
//             ],
//             moduleId: module.id,
//             action,
//             ...(targetType && targetId ? { targetType, targetId } : {}),
//           },
//         });

//         if (hasPermission) {
//           return h.continue; // Allow request to proceed
//         }
//       }

//       return error(null, "Insufficient permissions", statusCodes.PERMISSION_DENIED)(h);
//     });
//   },
// };
