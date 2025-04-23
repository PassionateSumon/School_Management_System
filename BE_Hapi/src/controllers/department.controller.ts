import type { Request, ResponseToolkit } from "@hapi/hapi";
import { sequelize } from "../db/db";
import { Department } from "../models/Department.model";
import { School } from "../models/School.model";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { Op } from "sequelize";

// Create Department
export const createDepartment = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { name } = request.payload as { name: string };
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await School.findOne({
      where: { userId },
    })) as any;
    if (!user) {
      return error(null, "School not found", statusCodes.NOT_FOUND)(h);
    }

    const existingDepartment = (await Department.findOne({
      where: { name, schoolId: user.id },
    })) as any;
    if (existingDepartment) {
      return error(null, "Department already exists", statusCodes.CNFLICT)(h);
    }

    const department = (await Department.create({
      name,
      schoolId: user.id,
    })) as any;

    return success(
      {
        departmentId: department.id,
        name: department.name,
        schoolId: department.schoolId,
      },
      "Department created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to create department",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get All Departments
export const getAllDepartments = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await School.findOne({ where: { userId } })) as any;
    if (!user) {
      return error(null, "School not found", statusCodes.NOT_FOUND)(h);
    }

    const departments = (await Department.findAll({
      where: { schoolId: user.id },
      attributes: ["id", "name", "schoolId", "createdAt", "updatedAt"],
    })) as any;

    const response = departments.map((dept: any) => ({
      departmentId: dept.id,
      name: dept.name,
      schoolId: dept.schoolId,
    })) as any;

    return success(
      response,
      "Departments retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve departments",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Single Department
export const getSingleDepartment = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { departmentId } = request.params;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await School.findOne({ where: { userId } })) as any;
    if (!user) {
      return error(null, "School not found", statusCodes.NOT_FOUND)(h);
    }

    const department = (await Department.findOne({
      where: { id: departmentId, schoolId: user.id },
      attributes: ["id", "name", "schoolId", "createdAt", "updatedAt"],
    })) as any;

    if (!department) {
      return error(null, "Department not found", statusCodes.NOT_FOUND)(h);
    }

    return success(
      {
        departmentId: department.id,
        name: department.name,
        schoolId: department.schoolId,
      },
      "Department retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve department",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Department
export const updateDepartment = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { departmentId } = request.params;
  const { name } = request.payload as { name?: string };
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await School.findOne({
      where: { userId },
    })) as any;
    if (!user) {
      return error(null, "School not found", statusCodes.NOT_FOUND)(h);
    }

    const department = (await Department.findOne({
      where: { id: departmentId, schoolId: user.id },
    })) as any;
    if (!department) {
      return error(null, "Department not found", statusCodes.NOT_FOUND)(h);
    }

    if (name) {
      const existingDepartment = await Department.findOne({
        where: { name, schoolId: user.id, id: { [Op.ne]: departmentId } },
      });
      if (existingDepartment) {
        return error(
          null,
          "Department name already exists",
          statusCodes.CNFLICT
        )(h);
      }
    }

    await department.update({ name: name || department.name });

    return success(
      {
        departmentId: department.id,
        name: department.name,
        schoolId: department.schoolId,
      },
      "Department updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to update department",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Department
export const deleteDepartment = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { departmentId } = request.params;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await School.findOne({
      where: { userId },
    })) as any;
    if (!user) {
      return error(null, "School not found", statusCodes.NOT_FOUND)(h);
    }

    const department = await Department.findOne({
      where: { id: departmentId, schoolId: user.id },
    });
    if (!department) {
      return error(null, "Department not found", statusCodes.NOT_FOUND)(h);
    }

    await department.destroy();

    return success(
      null,
      "Department deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to delete department",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
