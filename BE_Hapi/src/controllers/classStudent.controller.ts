import type { Request, ResponseToolkit } from "@hapi/hapi";
import { sequelize } from "../db/db";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { Op } from "sequelize";
import { db } from "../db/db";

const { class: Class, classStudent: ClassStudent, role: Role, user: User } = db;

// Change Single Student Class
export const changeStudentClass = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { studentId, className } = request.payload as {
    studentId: string;
    className: string;
  };
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, { transaction })) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const student = (await User.findOne({
      where: { id: studentId, schoolId: user.schoolId },
      include: [{ model: Role, as: "role" }],
      transaction,
    })) as any;
    if (!student || student.role?.title.toLowerCase() !== "student") {
      await transaction.rollback();
      return error(
        null,
        "Student not found or not a student",
        statusCodes.NOT_FOUND
      )(h);
    }

    const classParts = className.split(" ");
    const classNameBase = classParts[0];
    const department = classParts[1] || null;
    const classRecord = (await Class.findOne({
      where: {
        name: { [Op.eq]: classNameBase },
        // department: department ? { [Op.eq]: department } : null,
        schoolId: user.schoolId,
      },
      transaction,
    })) as any;
    if (!classRecord) {
      await transaction.rollback();
      return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
    }

    const classStudent = (await ClassStudent.findOne({
      where: { userId: studentId, schoolId: user.schoolId },
      transaction,
    })) as any;
    if (!classStudent) {
      await transaction.rollback();
      return error(
        null,
        "Student not assigned to any class",
        statusCodes.NOT_FOUND
      )(h);
    }

    await classStudent.update({ classId: classRecord.id }, { transaction });

    await transaction.commit();
    return success(
      {
        studentId: student.id,
        classId: classRecord.id,
        className: classRecord.department
          ? `${classRecord.name} ${classRecord.department}`
          : classRecord.name,
      },
      "Student class updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to update student class",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Bulk Change Student Class
export const bulkChangeStudentClass = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { studentIds, className } = request.payload as {
    studentIds: string[];
    className: string;
  };
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, { transaction })) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const students = (await User.findAll({
      where: { id: { [Op.in]: studentIds }, schoolId: user.schoolId },
      include: [Role],
      transaction,
    })) as any;
    if (students.length !== studentIds.length) {
      await transaction.rollback();
      return error(
        null,
        "One or more students not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    if (
      !students.every(
        (student: any) => student.role?.title.toLowerCase() === "student"
      )
    ) {
      await transaction.rollback();
      return error(
        null,
        "One or more users are not students",
        statusCodes.BAD_REQUEST
      )(h);
    }

    const classParts = className.split(" ");
    const classNameBase = classParts[0];
    const department = classParts[1] || null;
    const classRecord = (await Class.findOne({
      where: {
        name: { [Op.eq]: classNameBase },
        department: department ? { [Op.eq]: department } : null,
        schoolId: user.schoolId,
      },
      transaction,
    })) as any;
    if (!classRecord) {
      await transaction.rollback();
      return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
    }

    const classStudents = await ClassStudent.findAll({
      where: { userId: { [Op.in]: studentIds }, schoolId: user.schoolId },
      transaction,
    });
    if (classStudents.length !== studentIds.length) {
      await transaction.rollback();
      return error(
        null,
        "One or more students not assigned to any class",
        statusCodes.NOT_FOUND
      )(h);
    }

    await ClassStudent.update(
      { classId: classRecord.id },
      {
        where: { userId: { [Op.in]: studentIds }, schoolId: user.schoolId },
        transaction,
      }
    );

    await transaction.commit();
    return success(
      {
        updatedStudents: studentIds,
        classId: classRecord.id,
        className: classRecord.department
          ? `${classRecord.name} ${classRecord.department}`
          : classRecord.name,
      },
      "Student classes updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to update student classes",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
