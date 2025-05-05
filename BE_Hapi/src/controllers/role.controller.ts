import type { Request, ResponseToolkit } from "@hapi/hapi";
import { sequelize } from "../db/db";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { Op } from "sequelize";
import type {
  CreateRolePayload,
  UpdateRolePayload,
} from "../interfaces/RoleInterfaces";
import { db } from "../db/db";

const { role: Role, user: User } = db;

// Create Role
export const createRole = async (request: Request, h: ResponseToolkit) => {
  const { title, schoolId, priority } = request.payload as CreateRolePayload;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const existingRole = (await Role.findOne({
      where: { title, schoolId },
    })) as any;
    if (existingRole) {
      return error(null, "Role already exists", statusCodes.CNFLICT)(h);
    }

    const role = (await Role.create({
      title,
      schoolId,
      priority,
    })) as any;

    return success(
      {
        roleId: role.id,
        title: role.title,
        schoolId: role.schoolId,
        priority: role.priority,
      },
      "Role created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to create role",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get All Roles
export const getAllRoles = async (request: Request, h: ResponseToolkit) => {
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const roles = (await Role.findAll({
      where: { schoolId: user.schoolId },
      attributes: [
        "id",
        "title",
        "schoolId",
        "priority",
        "createdAt",
        "updatedAt",
      ],
    })) as any;

    const response = roles.map((role: any) => ({
      roleId: role.id,
      title: role.title,
      schoolId: role.schoolId,
      priority: role.priority,
    }));

    return success(
      response,
      "Roles retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve roles",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Single Role
export const getSingleRole = async (request: Request, h: ResponseToolkit) => {
  const { roleId } = request.params;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const role = (await Role.findOne({
      where: { id: roleId, schoolId: user.schoolId },
      attributes: [
        "id",
        "title",
        "schoolId",
        "priority",
        "createdAt",
        "updatedAt",
      ],
    })) as any;

    if (!role) {
      return error(null, "Role not found", statusCodes.NOT_FOUND)(h);
    }

    return success(
      {
        roleId: role.id,
        title: role.title,
        schoolId: role.schoolId,
        priority: role.priority,
      },
      "Role retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve role",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Role
export const updateRole = async (request: Request, h: ResponseToolkit) => {
  const { roleId } = request.params;
  const { title, priority } = request.payload as UpdateRolePayload;
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, { transaction })) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const role = (await Role.findOne({
      where: { id: roleId, schoolId: user.schoolId },
      transaction,
    })) as any;
    if (!role) {
      await transaction.rollback();
      return error(null, "Role not found", statusCodes.NOT_FOUND)(h);
    }

    if (role.title.toLowerCase() === "super_admin") {
      await transaction.rollback();
      return error(
        null,
        "Cannot update super_admin role",
        statusCodes.BAD_REQUEST
      )(h);
    }

    if (title) {
      const existingRole = await Role.findOne({
        where: { title, schoolId: user.schoolId, id: { [Op.ne]: roleId } },
        transaction,
      });
      if (existingRole) {
        await transaction.rollback();
        return error(null, "Role title already exists", statusCodes.CNFLICT)(h);
      }
    }

    await role.update(
      {
        title: title || role.title,
        priority: priority !== undefined ? priority : role.priority,
      },
      { transaction }
    );

    await transaction.commit();
    return success(
      {
        roleId: role.id,
        title: role.title,
        schoolId: role.schoolId,
        priority: role.priority,
      },
      "Role updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to update role",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Single Role
export const deleteSingleRole = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { roleId } = request.params;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const role = (await Role.findOne({
      where: { id: roleId, schoolId: user.schoolId },
    })) as any;
    if (!role) {
      return error(null, "Role not found", statusCodes.NOT_FOUND)(h);
    }

    if (role.title.toLowerCase() === "super_admin") {
      return error(
        null,
        "Cannot delete super_admin role",
        statusCodes.BAD_REQUEST
      )(h);
    }

    await role.destroy();

    return success(null, "Role deleted successfully", statusCodes.SUCCESS)(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to delete role",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete All Roles (Excluding super_admin)
export const deleteAllRoles = async (request: Request, h: ResponseToolkit) => {
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, { transaction })) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    await Role.destroy({
      where: {
        schoolId: user.schoolId,
        title: { [Op.ne]: "super_admin" },
      },
      transaction,
    });

    await transaction.commit();
    return success(
      null,
      "All non-super_admin roles deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to delete roles",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
