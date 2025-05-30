import type { Request, ResponseToolkit } from "@hapi/hapi";
import { error, success } from "../utils/returnFunctions.util";
import type { GrantPermissionPayload } from "../interfaces/GrantPermissionPayload";
import { statusCodes } from "../config/constants";
import type {
  PaginationQuery,
  RolePermissionsQueryOrPayload,
  UpdateUserOrRolePermissionsPayload,
  UserPermissionsQueryOrPayload,
} from "../interfaces/PermissionInterfaces";
import { sequelize } from "../db/db";
import { Op } from "sequelize";
import { DataType } from "sequelize-typescript";
import { JWTUtil } from "../utils/jwtAll.util";
import { db } from "../db/db";

const {
  class: Class,
  event: Event,
  module: Module,
  permission: Permission,
  role: Role,
  school: School,
  user: User,
} = db;

const targetTypes = ["school", "class"];

// *** Create permission should be here ***

export const givePermission = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId, roleId, moduleName, action, targetType, targetId, scope } =
      req.payload as GrantPermissionPayload;

    if (scope === "specific" && (!userId || roleId)) {
      return error(
        null,
        "For scope 'specific', userId is required and roleId must be absent!",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (scope === "all" && (!roleId || userId)) {
      return error(
        null,
        "For scope 'all', roleId is required and userId must be absent!",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (!moduleName || !action || !targetType || !targetId || !scope) {
      return error(
        null,
        "Module name, action, target type, target ID, and scope are required!",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (!targetTypes.includes(targetType)) {
      return error(
        null,
        "Target type must be one of 'school', 'class'",
        statusCodes.BAD_REQUEST
      )(h);
    }

    const module: any = await Module.findOne({ where: { name: moduleName } });
    if (!module) {
      return error(null, "Module not found!", statusCodes.NOT_FOUND)(h);
    }

    let target;
    if (targetType === "school") {
      target = await School.findByPk(targetId);
    } else if (targetType === "class") {
      target = await Class.findByPk(targetId);
    }

    if (!target) {
      return error(null, `${targetType} not found!`, statusCodes.NOT_FOUND);
    }

    if (userId) {
      const user = await User.findByPk(userId);
      if (!user) {
        return error(
          null,
          "User not found by userId for permission!",
          statusCodes.NOT_FOUND
        );
      }
    } else if (roleId) {
      const role = await Role.findByPk(roleId);
      if (!role) {
        return error(
          null,
          "Role not found by roleId for permission!",
          statusCodes.NOT_FOUND
        );
      }
    }

    const accessToken = req.state.accessToken; // setter accessToken;
    const decoded = JWTUtil.verifyAccessToken(accessToken);
    if (!decoded) {
      return error(null, "Invalid access token!", statusCodes.UNAUTHORIZED)(h);
    }

    const setter: any = await User.findByPk(decoded.id);
    if (!setter) {
      return error(
        null,
        "Setter not found for giving permission!",
        statusCodes.NOT_FOUND
      );
    }

    const existingPermission = await Permission.findOne({
      where: {
        userId,
        roleId,
        moduleId: module.id,
        action,
        targetType,
        targetId,
        scope,
      },
    });
    if (existingPermission) {
      return error(
        null,
        "Permission already exists!",
        statusCodes.BAD_REQUEST
      )(h);
    }

    const permission = await Permission.create({
      title: `${moduleName} - ${action} on ${targetType}`,
      userId: userId || null,
      roleId: roleId || null,
      setterId: setter.id,
      moduleId: module.id,
      targetType,
      targetId,
      action,
      scope,
    });

    return success(
      permission,
      "Permission given successfully.",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    //  console.error("Signup Error:", err);
    // console.error("Error stack:", err.stack);
    return error(
      null,
      `${err?.message}` || "Internal server error!",
      err?.code || statusCodes.SERVER_ISSUE
    )(h);
  }
};

export const getSingleUserPermissions = async (
  req: Request,
  h: ResponseToolkit
) => {
  try {
    const { userId, targetType, targetId } =
      req.query as UserPermissionsQueryOrPayload;

    if (!userId) {
      return error(null, "userId is required!", statusCodes.BAD_REQUEST)(h);
    }
    if ((targetType && !targetId) || (!targetType && targetId)) {
      return error(
        null,
        "Both targetType and targetId must be provided together!",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (targetType && !targetTypes.includes(targetType)) {
      return error(
        null,
        "Target type must be one of 'school', 'class', 'event', or 'notice'!",
        statusCodes.BAD_REQUEST
      )(h);
    }

    const accessToken = req.state.accessToken;
    // console.log(accessToken);
    const decoded: any = JWTUtil.verifyAccessToken(accessToken);
    if (!decoded) {
      return error(null, "Invalid access token!", statusCodes.UNAUTHORIZED)(h);
    }
    // console.log("decoded: ", decoded);

    const requester: any = await User.findByPk(decoded.userId);
    if (!requester || !requester.isActive) {
      return error(
        null,
        "Requester not found or inactive!",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Verify target user
    const user: any = await User.findByPk(userId);
    // console.log(user)
    if (!user || !user.isActive) {
      return error(
        null,
        "User not found or inactive!",
        statusCodes.NOT_FOUND
      )(h);
    }

    if (targetType && targetId) {
      let target;
      if (targetType === "school") {
        target = await School.findByPk(targetId);
      } else if (targetType === "class") {
        target = await Class.findByPk(targetId);
      }
      if (!target) {
        return error(
          null,
          `${targetType} not found!`,
          statusCodes.NOT_FOUND
        )(h);
      }
    }

    const whereClause: any = { userId, scope: "specific" };
    if (targetType && targetId) {
      whereClause.targetType = targetType;
      whereClause.targetId = targetId;
    }

    const permissions = await Permission.findAll({
      where: whereClause,
      include: [
        {
          model: Module,
          as: "module",
          attributes: ["name"],
        },
      ],
      attributes: ["id", "action", "targetType", "targetId", "scope"],
    });

    const formattedPermissions = permissions.map((perm: any) => ({
      id: perm.id,
      moduleName: perm.module.name,
      action: perm.action,
      targetType: perm.targetType,
      targetId: perm.targetId,
      scope: perm.scope,
    }));

    return success(
      formattedPermissions,
      permissions.length
        ? "Permissions retrieved successfully."
        : "No permissions found.",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    console.error("Get Single User Permissions Error:", err);
    return error(
      null,
      err.message || "Internal server error!",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
export const getSingleRolePermissions = async (
  req: Request,
  h: ResponseToolkit
) => {
  try {
    const { roleId, targetType, targetId } =
      req.query as RolePermissionsQueryOrPayload;

    if (!roleId) {
      return error(null, "roleId is required!", statusCodes.BAD_REQUEST)(h);
    }
    if ((targetType && !targetId) || (!targetType && targetId)) {
      return error(
        null,
        "Both targetType and targetId must be provided together!",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (targetType && !targetTypes.includes(targetType)) {
      return error(
        null,
        "Target type must be one of 'school', 'class', 'event', or 'notice'!",
        statusCodes.BAD_REQUEST
      )(h);
    }

    const accessToken = req.state.accessToken;
    const decoded = JWTUtil.verifyAccessToken(accessToken);
    if (!decoded) {
      return error(null, "Invalid access token!", statusCodes.UNAUTHORIZED)(h);
    }

    const requester = (await User.findByPk(decoded.id)) as any;
    if (!requester || !requester.isActive) {
      return error(
        null,
        "Requester not found or inactive!",
        statusCodes.NOT_FOUND
      )(h);
    }

    const role = (await Role.findByPk(roleId)) as any;
    if (!role) {
      return error(null, "Role not found!", statusCodes.NOT_FOUND)(h);
    }

    if (targetType && targetId) {
      let target;
      if (targetType === "school") {
        target = await School.findByPk(targetId);
      } else if (targetType === "class") {
        target = await Class.findByPk(targetId);
      } else if (targetType === "event") {
        target = await Event.findByPk(targetId);
      }
      if (!target) {
        return error(
          null,
          `${targetType} not found!`,
          statusCodes.NOT_FOUND
        )(h);
      }
    }

    // Build where clause
    const whereClause: any = { roleId, scope: "all" };
    if (targetType && targetId) {
      whereClause.targetType = targetType;
      whereClause.targetId = targetId;
    }

    const permissions = await Permission.findAll({
      where: whereClause,
      include: [
        {
          model: Module,
          as: "module",
          attributes: ["name"],
        },
      ],
      attributes: ["id", "title", "action", "targetType", "targetId", "scope"],
    });

    const formattedPermissions = permissions.map((perm: any) => ({
      id: perm.id,
      title: perm.title,
      moduleName: perm.module.name,
      action: perm.action,
      targetType: perm.targetType,
      targetId: perm.targetId,
      scope: perm.scope,
    }));

    return success(
      formattedPermissions,
      permissions.length
        ? "Permissions retrieved successfully."
        : "No permissions found.",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    console.error("Get Single Role Permissions Error:", err);
    return error(
      null,
      err.message || "Internal server error!",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

export const updateSingleUserOrRolePermissions = async (
  req: Request,
  h: ResponseToolkit
) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId, roleId, targetType, targetId, permissions } =
      req.payload as UpdateUserOrRolePermissionsPayload;
    const { limit, offset } = req.query as PaginationQuery;

    if ((!userId && !roleId) || (userId && roleId)) {
      await transaction.rollback();
      return error(
        null,
        "Exactly one of userId or roleId must be provided",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if ((targetType && !targetId) || (!targetType && targetId)) {
      await transaction.rollback();
      return error(
        null,
        "Both targetType and targetId must be provided together",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (targetType && !targetTypes.includes(targetType)) {
      await transaction.rollback();
      return error(
        null,
        `Target type must be one of ${targetTypes.join(", ")}`,
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (
      !permissions ||
      !Array.isArray(permissions) ||
      permissions.length === 0
    ) {
      await transaction.rollback();
      return error(
        null,
        "permissions array must be non-empty",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Validate pagination
    const parsedLimit = limit ? parseInt(String(limit), 10) : undefined;
    const parsedOffset = offset ? parseInt(String(offset), 10) : undefined;
    if (parsedLimit !== undefined && (isNaN(parsedLimit) || parsedLimit < 1)) {
      await transaction.rollback();
      return error(
        null,
        "limit must be a positive integer",
        statusCodes.BAD_REQUEST
      )(h);
    }
    if (
      parsedOffset !== undefined &&
      (isNaN(parsedOffset) || parsedOffset < 0)
    ) {
      await transaction.rollback();
      return error(
        null,
        "offset must be a non-negative integer",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Verify authenticated user
    const accessToken = req.state.accessToken;
    const decoded = JWTUtil.verifyAccessToken(accessToken);
    if (!decoded) {
      await transaction.rollback();
      return error(null, "Invalid access token", statusCodes.UNAUTHORIZED)(h);
    }

    const requester = (await User.findByPk(decoded.id, {
      transaction,
    })) as any;
    if (!requester || !requester.isActive) {
      await transaction.rollback();
      return error(
        null,
        "Requester not found or inactive",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Validate target entity
    let entity: any = null;
    let defaultSchoolId: string | undefined;
    if (userId) {
      entity = await User.findByPk(userId, { transaction });
      defaultSchoolId = (entity as any)?.schoolId;
    } else {
      entity = await Role.findByPk(roleId, { transaction });
      defaultSchoolId = (entity as any)?.schoolId;
    }
    if (!entity || !entity.isActive) {
      await transaction.rollback();
      return error(
        null,
        `${userId ? "User" : "Role"} not found or inactive`,
        statusCodes.NOT_FOUND
      )(h);
    }
    if (!targetType && !defaultSchoolId) {
      await transaction.rollback();
      return error(
        null,
        `${
          userId ? "User" : "Role"
        } must have a schoolId if targetType is not provided`,
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Validate target resource
    let target: any = null;
    if (targetType && targetId) {
      if (targetType === "school")
        target = await School.findByPk(targetId, { transaction });
      else if (targetType === "class")
        target = await Class.findByPk(targetId, { transaction });
      else if (targetType === "event")
        target = await Event.findByPk(targetId, { transaction });
      if (!target) {
        await transaction.rollback();
        return error(
          null,
          `${targetType} not found with ID ${targetId}`,
          statusCodes.NOT_FOUND
        )(h);
      }
    }

    // Validate modules
    const moduleNames = [...new Set(permissions.map((p) => p.moduleName))];
    const modules = (await Module.findAll({
      where: { name: { [Op.in]: moduleNames } },
      attributes: ["id", "name"],
      transaction,
    })) as any[];
    const moduleMap = new Map(modules.map((m) => [m.name, m]));
    for (const moduleName of moduleNames) {
      if (!moduleMap.has(moduleName)) {
        await transaction.rollback();
        return error(
          null,
          `Module '${moduleName}' not found`,
          statusCodes.NOT_FOUND
        )(h);
      }
    }

    // process permisions
    const scope = userId ? "specific" : "all";
    const whereClause: any = userId ? { userId, scope } : { roleId, scope };
    if (targetType && targetId) {
      whereClause.targetType = targetType;
      whereClause.targetId = targetId;
    } else {
      whereClause.targetType = "school";
      whereClause.targetId = defaultSchoolId;
    }

    const permissionsToCreate: any[] = [];
    const permissionsToDelete: any[] = [];
    const moduleIdsProcessed: string[] = [];

    for (const perm of permissions) {
      const { moduleName, actions } = perm;
      const module = moduleMap.get(moduleName) as any;

      if (!Array.isArray(actions) || actions.length === 0) {
        await transaction.rollback();
        return error(
          null,
          `Actions for module '${moduleName}' must be a non-empty array`,
          statusCodes.BAD_REQUEST
        )(h);
      }
      const uniqueActions = [...new Set(actions)]; // remove duplicates
      for (const action of uniqueActions) {
        if (typeof action !== "string" || action.trim() === "") {
          await transaction.rollback();
          return error(
            null,
            `Action '${action}' for module '${moduleName}' must be a non-empty string`,
            statusCodes.BAD_REQUEST
          )(h);
        }
      }

      moduleIdsProcessed.push(module.id);

      // Fetched existing permissions -->
      const existingPermissions = (await Permission.findAll({
        where: {
          ...whereClause,
          moduleId: module.id,
        },
        attributes: ["action"],
        transaction,
      })) as any[];
      const existingActions = new Set(existingPermissions.map((p) => p.action));

      for (const action of uniqueActions) {
        if (!existingActions.has(action)) {
          // add new action
          permissionsToCreate.push({
            id: DataType.UUIDV4,
            title: `Permission for ${moduleName} - ${action} on ${whereClause.targetType}`,
            userId: userId || null,
            roleId: roleId || null,
            setterId: requester.id,
            moduleId: module.id,
            targetType: whereClause.targetType,
            targetId: whereClause.targetId,
            action,
            scope,
          });
        } else {
          // if exist then change the title and the current setter
          await Permission.update(
            {
              title: `Permission for ${moduleName} - ${action} on ${whereClause.targetType}`,
              setterId: requester.id,
            },
            {
              where: { ...whereClause, moduleId: module.id, action },
              transaction,
            }
          );
        }
      }
      // Remove the existing actions not in payload
      for (const action of existingActions) {
        if (!uniqueActions.includes(action)) {
          permissionsToDelete.push({ moduleId: module.id, action });
        }
      }
    }

    // Delete removed permissions
    if (permissionsToDelete.length > 0) {
      await Permission.destroy({
        where: {
          ...whereClause,
          [Op.or]: permissionsToDelete.map(({ moduleId, action }) => ({
            moduleId,
            action,
          })),
        },
        transaction,
      });
    }

    //create bulk permissions in the new list
    if (permissionsToCreate.length > 0) {
      await Permission.bulkCreate(permissionsToCreate, { transaction });
    }

    // Fetch updated permissions
    const finalPermissions = (await Permission.findAll({
      where: { ...whereClause, moduleId: { [Op.in]: moduleIdsProcessed } },
      include: [{ model: Module, as: "module", attributes: ["name"] }],
      attributes: ["id", "title", "action", "targetType", "targetId", "scope"],
      limit: parsedLimit,
      offset: parsedOffset,
      transaction,
    })) as any[];

    const formattedPermissions = finalPermissions.map((perm) => ({
      id: perm.id,
      title: perm.title,
      moduleName: perm.module.name,
      action: perm.action,
      targetType: perm.targetType,
      targetId: perm.targetId,
      scope: perm.scope,
    }));

    await transaction.commit();
    return success(
      formattedPermissions,
      formattedPermissions.length
        ? "Permissions updated successfully"
        : "No permissions updated",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    console.error("Update Permissions for User or Role Error:", err);
    return error(
      null,
      err.message || "Internal server error",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// export const updateSingleUserPermissions = async (
//   req: Request,
//   h: ResponseToolkit
// ) => {
//   const transaction = await sequelize.transaction();
//   try {
//     const { userId, targetType, targetId, permissions } =
//       req.payload as UpdateUserPermissionsPayload;
//     const { limit, offset } = req.query as PaginationQuery;

//     if (!userId) {
//       await transaction.rollback();
//       return error(null, "userId is required!", statusCodes.BAD_REQUEST)(h);
//     }
//     if ((targetType && !targetId) || (!targetType && targetId)) {
//       await transaction.rollback();
//       return error(
//         null,
//         "Both targetType and targetId must be provided together!",
//         statusCodes.BAD_REQUEST
//       )(h);
//     }
//     if (targetType && !targetTypes.includes(targetType)) {
//       await transaction.rollback();
//       return error(
//         null,
//         "Target type must be one of 'school', 'class', 'event', or 'notice'!",
//         statusCodes.BAD_REQUEST
//       )(h);
//     }
//     if (
//       /!permissions ||
//       /!Array.isArray(permissions) ||
//       permissions.length === 0
//     ) {
//       await transaction.rollback();
//       return error(
//         null,
//         "permissions array is required and must not be empty",
//         statusCodes.BAD_REQUEST
//       )(h);
//     }

//     const parsedLimit = limit ? parseInt(String(limit), 10) : undefined;
//     const parsedOffset = offset ? parseInt(String(offset), 10) : undefined;
//     if (parsedLimit !== undefined && (isNaN(parsedLimit) || parsedLimit < 0)) {
//       await transaction.rollback();
//       return error(
//         null,
//         "limit must be a positive integer",
//         statusCodes.BAD_REQUEST
//       )(h);
//     }
//     if (
//       parsedOffset !== undefined &&
//       (isNaN(parsedOffset) || parsedOffset < 0)
//     ) {
//       await transaction.rollback();
//       return error(
//         null,
//         "offset must be a non-negative integer",
//         statusCodes.BAD_REQUEST
//       )(h);
//     }

//     const accessToken = req.state.accessToken;
//     // console.log(accessToken);
//     const decoded: any = JWTUtil.verifyAccessToken(accessToken);
//     if (!decoded) {
//       return error(null, "Invalid access token!", statusCodes.UNAUTHORIZED)(h);
//     }
//     // console.log("decoded: ", decoded);

//     const requester: any = await User.findByPk(decoded.userId);
//     if (!requester || !requester.isActive) {
//       return error(
//         null,
//         "Requester not found or inactive!",
//         statusCodes.NOT_FOUND
//       )(h);
//     }

//     // Verify target user
//     const user: any = await User.findByPk(userId);
//     if (!user || !user.isActive) {
//       return error(
//         null,
//         "User not found or inactive!",
//         statusCodes.NOT_FOUND
//       )(h);
//     }

//     if (targetType && targetId) {
//       let target;
//       if (targetType === "school") {
//         target = await School.findByPk(targetId);
//       } else if (targetType === "class") {
//         target = await Class.findByPk(targetId);
//       } else if (targetType === "event") {
//         target = await Event.findByPk(targetId);
//       }
//       if (!target) {
//         return error(
//           null,
//           `${targetType} not found!`,
//           statusCodes.NOT_FOUND
//         )(h);
//       }
//     }

//     // Validate module in One query:
//     const moduleNames = [
//       ...new Set(permissions.map((perm: any) => perm.moduleName)),
//     ]; // remove duplicates
//     const modules = (await Module.findAll({
//       where: {
//         name: { [Op.in]: moduleNames },
//       },
//       attributes: ["id", "name"],
//       transaction,
//     })) as any;

//     const moduleMap = new Map(modules.map((mod: any) => [mod.name, mod]));
//     for (const moduleName of moduleNames) {
//       if (!moduleMap.has(moduleName)) {
//         await transaction.rollback();
//         return error(
//           null,
//           `Module ${moduleName} not found!`,
//           statusCodes.NOT_FOUND
//         )(h);
//       }
//     }

//     // Process Permissions -->
//     const permissionsToCreate: any[] = [];
//     const moduleIdsToKeep: any[] = [];
//     const actionsToKeep: { [moduleId: string]: string } = {};

//     for (const perm of permissions) {
//       const { moduleName, actions } = perm;
//       const module = moduleMap.get(moduleName) as any;

//       if (!Array.isArray(actions) || actions.length === 0) {
//         await transaction.rollback();
//         return error(
//           null,
//           `Actions for module '${moduleName}' must be a non-empty array`,
//           statusCodes.BAD_REQUEST
//         )(h);
//       }
//       const uniqueActions: any = [...new Set(actions)]; // remove duplicates
//       for (const action of uniqueActions) {
//         if (typeof action !== "string" || action.trim() === "") {
//           await transaction.rollback();
//           return error(
//             null,
//             `Action '${action}' for module '${moduleName}' must be a non-empty string`,
//             statusCodes.BAD_REQUEST
//           )(h);
//         }
//       }

//       moduleIdsToKeep.push(module.id);
//       actionsToKeep[module.id] = uniqueActions;

//       // Create new permissions
//       for (const action of uniqueActions) {
//         const permissionData = {
//           id: DataType.UUIDV4,
//           title: `${moduleName} - ${action} on ${targetType || "school"}`,
//           userId,
//           roleId: null,
//           setterId: requester.id,
//           moduleId: module.id,
//           targetType: targetType || "school",
//           targetId: targetId || user.schoolId,
//           action,
//           scope: "specific",
//         };

//         // find existing
//         const exists = await Permission.findOne({
//           where: {
//             userId,
//             moduleId: module.id,
//             action,
//             targetType: permissionData.targetType,
//             targetId: permissionData.targetId,
//             scope: "specific",
//           },
//           transaction,
//         });
//         if (exists) {
//           await transaction.rollback();
//           return error(
//             null,
//             `Permission already exists!`,
//             statusCodes.BAD_REQUEST
//           )(h);
//         } else {
//           permissionsToCreate.push(permissionData);
//         }
//       }
//     }

//     // Delete permissions which are not included in the new set
//     const whereClause: any = {
//       userId,
//       scope: "specific",
//       moduleId: { [Op.in]: moduleIdsToKeep },
//     };
//     if (targetId && targetType) {
//       whereClause.targetType = targetType;
//       whereClause.targetId = targetId;
//     }

//     await Permission.destroy({
//       where: {
//         ...whereClause,
//         action: {
//           [Op.notIn]: Object.values(actionsToKeep),
//         },
//       },
//       transaction,
//     });

//     // Bulk craete for new permissions (Optimization)
//     if (permissionsToCreate.length > 0) {
//       await Permission.bulkCreate(permissionsToCreate, {
//         transaction,
//       });
//     }

//     // fetch all the current permissions for response with pagination
//     const finalWhereClause: any = {
//       userId,
//       scope: "specific",
//     };
//     if (targetId && targetType) {
//       finalWhereClause.targetType = targetType;
//       finalWhereClause.targetId = targetId;
//     }

//     const finalPermissions = await Permission.findAll({
//       where: finalWhereClause,
//       include: [
//         {
//           model: Module,
//           as: "module",
//           attributes: ["name"],
//         },
//       ],
//       attributes: ["id", "title", "action", "targetType", "targetId", "scope"],
//       limit: parsedLimit,
//       offset: parsedOffset,
//       transaction,
//     });

//     const formattedPermissions = finalPermissions.map((perm: any) => ({
//       id: perm.id,
//       title: perm.title,
//       moduleName: perm.module.name,
//       action: perm.action,
//       targetType: perm.targetType,
//       targetId: perm.targetId,
//       scope: perm.scope,
//     }));

//     await transaction.commit();
//     return success(
//       formattedPermissions,
//       finalPermissions.length
//         ? "Permissions updated successfully"
//         : "No permissions set",
//       statusCodes.SUCCESS
//     )(h);
//   } catch (err: any) {
//     await transaction.rollback();
//     console.error("Update Single User Permissions Error:", err);
//     return error(
//       null,
//       err.message || "Internal server error",
//       statusCodes.SERVER_ISSUE
//     )(h);
//   }
// };
// export const updateSingleRolePermissions = async (
//   req: Request,
//   h: ResponseToolkit
// ) => {
//   const transaction = await sequelize.transaction();
//   try {
//     const { roleId, targetType, targetId, permissions } =
//       req.payload as UpdateRolePermissionsPayload;
//     const { limit, offset } = req.query as PaginationQuery;

//     if (!roleId) {
//       await transaction.rollback();
//       return error(null, "userId is required!", statusCodes.BAD_REQUEST)(h);
//     }
//     if ((targetType && !targetId) || (!targetType && targetId)) {
//       await transaction.rollback();
//       return error(
//         null,
//         "Both targetType and targetId must be provided together!",
//         statusCodes.BAD_REQUEST
//       )(h);
//     }
//     if (targetType && !targetTypes.includes(targetType)) {
//       await transaction.rollback();
//       return error(
//         null,
//         "Target type must be one of 'school', 'class', 'event', or 'notice'!",
//         statusCodes.BAD_REQUEST
//       )(h);
//     }
//     if (
//       !permissions ||
//       !Array.isArray(permissions) ||
//       permissions.length === 0
//     ) {
//       await transaction.rollback();
//       return error(
//         null,
//         "permissions array is required and must not be empty",
//         statusCodes.BAD_REQUEST
//       )(h);
//     }

//     const parsedLimit = limit ? parseInt(String(limit), 10) : undefined;
//     const parsedOffset = offset ? parseInt(String(offset), 10) : undefined;
//     if (parsedLimit !== undefined && (isNaN(parsedLimit) || parsedLimit < 0)) {
//       await transaction.rollback();
//       return error(
//         null,
//         "limit must be a positive integer",
//         statusCodes.BAD_REQUEST
//       )(h);
//     }
//     if (
//       parsedOffset !== undefined &&
//       (isNaN(parsedOffset) || parsedOffset < 0)
//     ) {
//       await transaction.rollback();
//       return error(
//         null,
//         "offset must be a non-negative integer",
//         statusCodes.BAD_REQUEST
//       )(h);
//     }

//     const accessToken = req.state.accessToken;
//     // console.log(accessToken);
//     const decoded: any = JWTUtil.verifyAccessToken(accessToken);
//     if (!decoded) {
//       return error(null, "Invalid access token!", statusCodes.UNAUTHORIZED)(h);
//     }
//     // console.log("decoded: ", decoded);

//     const requester: any = await User.findByPk(decoded.userId);
//     if (!requester || !requester.isActive) {
//       return error(
//         null,
//         "Requester not found or inactive!",
//         statusCodes.NOT_FOUND
//       )(h);
//     }

//     // Verify target role
//     const role = (await Role.findByPk(roleId, {
//       transaction,
//     })) as any;
//     if (!role || !role.isActive) {
//       await transaction.rollback();
//       return error(
//         null,
//         "Role not found or inactive",
//         statusCodes.NOT_FOUND
//       )(h);
//     }

//     if (targetType && targetId) {
//       let target;
//       if (targetType === "school") {
//         target = await School.findByPk(targetId);
//       } else if (targetType === "class") {
//         target = await Class.findByPk(targetId);
//       } else if (targetType === "event") {
//         target = await Event.findByPk(targetId);
//       }
//       if (!target) {
//         return error(
//           null,
//           `${targetType} not found!`,
//           statusCodes.NOT_FOUND
//         )(h);
//       }
//     }

//     // Validate module in One query:
//     const moduleNames = [
//       ...new Set(permissions.map((perm: any) => perm.moduleName)),
//     ]; // remove duplicates
//     const modules = (await Module.findAll({
//       where: {
//         name: { [Op.in]: moduleNames },
//       },
//       attributes: ["id", "name"],
//       transaction,
//     })) as any;

//     const moduleMap = new Map(modules.map((mod: any) => [mod.name, mod]));
//     for (const moduleName of moduleNames) {
//       if (!moduleMap.has(moduleName)) {
//         await transaction.rollback();
//         return error(
//           null,
//           `Module ${moduleName} not found!`,
//           statusCodes.NOT_FOUND
//         )(h);
//       }
//     }

//   } catch (err: any) {
//     await transaction.rollback();
//     console.error("Update Single Role Permissions Error:", error);
//     return error(
//       null,
//       err.message || "Internal server error",
//       statusCodes.SERVER_ISSUE
//     )(h);
//   }
// };
