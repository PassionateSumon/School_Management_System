import type { Request, ResponseToolkit } from "@hapi/hapi";
import { sequelize } from "../db/db";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { Op } from "sequelize";
import { db } from "../db/db";

const { class: Class, school: School, user: User } = db;

// Valid departments
export const VALID_DEPARTMENTS = ["Arts", "Science", "Commerce", null];

// Create Class
export const createClass = async (request: Request, h: ResponseToolkit) => {
  const { name, department } = request.payload as {
    name: string;
    department?: string;
  };
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, {
      // include: [Role],
      transaction,
    })) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const school = (await School.findByPk(user.schoolId, {
      transaction,
    })) as any;
    if (!school) {
      await transaction.rollback();
      return error(null, "School not found", statusCodes.NOT_FOUND)(h);
    }

    // Validate department
    if (department && !VALID_DEPARTMENTS.includes(department)) {
      await transaction.rollback();
      return error(
        null,
        `Invalid department. Must be one of: ${VALID_DEPARTMENTS.filter(
          (d) => d
        ).join(", ")}`,
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Check for duplicate class name + department in school
    const existingClass = (await Class.findOne({
      where: {
        name: { [Op.eq]: name },
        schoolId: user.schoolId,
      },
      transaction,
    })) as any;
    if (existingClass) {
      await transaction.rollback();
      return error(
        null,
        `Class '${name}${
          department ? ` ${department}` : ""
        }' already exists in the school`,
        statusCodes.CNFLICT
      )(h);
    }

    const newClass = (await Class.create(
      {
        name,
        schoolId: user.schoolId,
      },
      { transaction }
    )) as any;

    await transaction.commit();
    return success(
      {
        classId: newClass.id,
        name: newClass.name,
        schoolId: newClass.schoolId,
      },
      "Class created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to create class",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// List Classes
export const listClasses = async (request: Request, h: ResponseToolkit) => {
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    // Check if user is super_admin or has read permission
    // if (user.role?.title.toLowerCase() !== "super_admin") {
    //   const hasPermission = (await user.$hasPermission({
    //     module: "class",
    //     action: "read",
    //     targetType: "school",
    //     targetId: user.schoolId,
    //   })) as any;
    //   if (!hasPermission) {
    //     return error(
    //       null,
    //       "Not authorized to view classes",
    //       statusCodes.PERMISSION_DENIED
    //     )(h);
    //   }
    // }

    const classes = await Class.findAll({
      where: { schoolId: user.schoolId },
      attributes: ["id", "name", "schoolId", "createdAt"],
      order: [["name", "ASC"]],
    });

    return success(
      classes,
      "Classes retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to list classes",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get specific Class
export const getClass = async (request: Request, h: ResponseToolkit) => {
  const { classId } = request.params;
  const { userId } = request.auth.credentials as any;
  console.log(classId);

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const classRecord = (await Class.findByPk(classId, {
      attributes: ["id", "name", "schoolId", "createdAt", "updatedAt"],
    })) as any;

    if (!classRecord) {
      return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
    }

    return success(
      classRecord,
      "Class retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve class",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Class
export const updateClass = async (request: Request, h: ResponseToolkit) => {
  const { classId } = request.params;
  const { name, department } = request.payload as {
    name?: string;
    department?: string;
  };
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, {
      transaction,
    })) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const classRecord = (await Class.findByPk(classId, { transaction })) as any;
    if (!classRecord) {
      await transaction.rollback();
      return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
    }

    // Validate department
    if (department && !VALID_DEPARTMENTS.includes(department)) {
      await transaction.rollback();
      return error(
        null,
        `Invalid department. Must be one of: ${VALID_DEPARTMENTS.filter(
          (d) => d
        ).join(", ")}`,
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Check for duplicate name + department (if updated)
    if (name || department) {
      const finalName = name || classRecord.name;
      const finalDepartment =
        department !== undefined ? department : classRecord.department;
      const existingClass = await Class.findOne({
        where: {
          name: { [Op.eq]: finalName },
          department: finalDepartment ? { [Op.eq]: finalDepartment } : null,
          schoolId: user.schoolId,
          id: { [Op.ne]: classId },
        },
        transaction,
      });
      if (existingClass) {
        await transaction.rollback();
        return error(
          null,
          `Class '${finalName}${
            finalDepartment ? ` ${finalDepartment}` : ""
          }' already exists in the school`,
          statusCodes.CNFLICT
        )(h);
      }
    }

    // Update class
    await classRecord.update(
      {
        name: name || classRecord.name,
        department:
          department !== undefined ? department : classRecord.department,
      },
      { transaction }
    );

    await transaction.commit();
    return success(
      {
        classId: classRecord.id,
        name: classRecord.name,
        department: classRecord.department,
        schoolId: classRecord.schoolId,
      },
      "Class updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to update class",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Class
export const deleteClass = async (request: Request, h: ResponseToolkit) => {
  const { classId } = request.params;
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, {
      transaction,
    })) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const classRecord = (await Class.findByPk(classId, { transaction })) as any;
    if (!classRecord) {
      await transaction.rollback();
      return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
    }

    await classRecord.destroy({ transaction });

    await transaction.commit();
    return success(null, "Class deleted successfully", statusCodes.SUCCESS)(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to delete class",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
