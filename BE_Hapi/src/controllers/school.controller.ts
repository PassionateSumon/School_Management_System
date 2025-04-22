import type { Request, ResponseToolkit } from "@hapi/hapi";
import Joi from "joi";
import { sequelize } from "../db/db";
import { School } from "../models/School.model";
import { User } from "../models/User.model";
import { Role } from "../models/Role.model";
import { Permission } from "../models/Permission.model";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { Op } from "sequelize";

//*** GradeScale is remaining ***//

// Create School
export const createSchool = async (request: Request, h: ResponseToolkit) => {
  const { name, address } = request.payload as {
    name: string;
    address?: string;
  };
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    // Validate user and super_admin role
    const user = (await User.findByPk(userId, {
      include: [Role],
      transaction,
    })) as any;
    if (!user) {
      await transaction.rollback();
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }
    if (!user.role || user.role.title.toLowerCase() !== "super_admin") {
      await transaction.rollback();
      return error(
        null,
        "Only super admins can create schools",
        statusCodes.PERMISSION_DENIED
      )(h);
    }

    // Check for duplicate school name
    const existingSchool = await School.findOne({
      where: { name: { [Op.iLike]: name } },
      transaction,
    });
    if (existingSchool) {
      await transaction.rollback();
      return error(
        null,
        "School with this name already exists",
        statusCodes.CNFLICT
      )(h);
    }

    // Create school
    const school = (await School.create(
      { name, address },
      { transaction }
    )) as any;

    // Update super_admin's schoolId
    await user.update({ schoolId: school.id }, { transaction });

    // Grant super_admin full permissions for the school
    await Permission.create(
      {
        userId: user.id,
        module: "school",
        action: "manage-all",
        targetType: "school",
        targetId: school.id,
        scope: "specific",
        setterId: user.id,
      },
      { transaction }
    );

    await transaction.commit();
    return success(
      { schoolId: school.id, name: school.name },
      "School created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to create school",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// List Schools
export const listSchools = async (request: Request, h: ResponseToolkit) => {
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId, { include: [Role] })) as any;
    if (!user) {
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    // Super admin sees all schools, others see only their school
    const where: any = {};
    if (user.role?.title.toLowerCase() !== "super_admin") {
      if (!user.schoolId) {
        return error(
          null,
          "User is not associated with any school",
          statusCodes.BAD_REQUEST
        )(h);
      }
      where.id = user.schoolId;
    }

    const schools = await School.findAll({
      where,
      attributes: ["id", "name", "address", "createdAt"],
      order: [["name", "ASC"]],
    });

    if (!schools || schools.length === 0) {
      return error(null, "No schools found", statusCodes.NOT_FOUND)(h);
    }

    return success(
      schools,
      "Schools retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to list schools",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get School
export const getSchool = async (request: Request, h: ResponseToolkit) => {
  const { schoolId } = request.params;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId, { include: [Role] })) as any;
    if (!user) {
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    const school = await School.findByPk(schoolId, {
      attributes: ["id", "name", "address", "createdAt", "updatedAt"],
    });

    if (!school) {
      return error(null, "School not found", statusCodes.NOT_FOUND)(h);
    }

    // Check if user is authorized to view this school
    if (
      user.role?.title.toLowerCase() !== "super_admin" &&
      user.schoolId !== schoolId
    ) {
      return error(
        null,
        "Not authorized to view this school",
        statusCodes.PERMISSION_DENIED
      )(h);
    }

    return success(
      school,
      "School retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve school",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update School
export const updateSchool = async (request: Request, h: ResponseToolkit) => {
  const { schoolId } = request.params;
  const { name, address } = request.payload as {
    name?: string;
    address?: string;
  };
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, {
      include: [Role],
      transaction,
    })) as any;
    if (!user) {
      await transaction.rollback();
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    const school = (await School.findByPk(schoolId, { transaction })) as any;
    if (!school) {
      await transaction.rollback();
      return error(null, "School not found", statusCodes.NOT_FOUND)(h);
    }

    // Check if user is authorized to update this school
    if (
      user.role?.title.toLowerCase() !== "super_admin" &&
      user.schoolId !== schoolId
    ) {
      await transaction.rollback();
      return error(
        null,
        "Not authorized to update this school",
        statusCodes.PERMISSION_DENIED
      )(h);
    }

    // Check for duplicate name (if name is updated)
    if (name && name !== school.name) {
      const existingSchool = (await School.findOne({
        where: { name: { [Op.iLike]: name }, id: { [Op.ne]: schoolId } },
        transaction,
      })) as any;
      if (existingSchool) {
        await transaction.rollback();
        return error(
          null,
          "School with this name already exists",
          statusCodes.CNFLICT
        )(h);
      }
    }

    // Update school
    await school.update({ name, address }, { transaction });

    await transaction.commit();
    return success(
      { schoolId: school.id, name: school.name, address: school.address },
      "School updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to update school",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete School
export const deleteSchool = async (request: Request, h: ResponseToolkit) => {
  const { schoolId } = request.params;
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, {
      include: [Role],
      transaction,
    })) as any;
    if (!user) {
      await transaction.rollback();
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    // Only super_admin can delete schools
    if (user.role?.title.toLowerCase() !== "super_admin") {
      await transaction.rollback();
      return error(
        null,
        "Only super admins can delete schools",
        statusCodes.PERMISSION_DENIED
      )(h);
    }

    const school = await School.findByPk(schoolId, { transaction });
    if (!school) {
      await transaction.rollback();
      return error(null, "School not found", statusCodes.NOT_FOUND)(h);
    }

    // Delete school (associated users are deleted automatically via onDelete: CASCADE)
    await school.destroy({ transaction });

    await transaction.commit();
    return success(null, "School deleted successfully", statusCodes.SUCCESS)(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to delete school",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
