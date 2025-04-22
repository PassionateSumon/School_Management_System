import type { Request, ResponseToolkit } from "@hapi/hapi";
import Joi from "joi";
import { sequelize } from "../db/db";
import { Class } from "../models/Class.model";
import { User } from "../models/User.model";
import { Role } from "../models/Role.model";
import { School } from "../models/School.model";
import { Subject } from "../models/Subject.model";
import { ClassSchedule } from "../models/ClassSchedule.model";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { Op, literal } from "sequelize";

// Create ClassSchedule
export const createClassSchedule = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { teacherName, subjectName, className, date, startTime, endTime } =
    request.payload as {
      teacherName: string;
      subjectName: string;
      className: string;
      date: string;
      startTime: string;
      endTime: string;
    };
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    // Validate user and school
    const user = (await User.findByPk(userId, {
      include: [Role],
      transaction,
    })) as any;
    if (!user || !user.schoolId || !user.role) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    // Validate class by className
    const classParts = className.split(" ");
    const classNameBase = classParts[0];
    const department = classParts[1] || null;
    const classRecord = (await Class.findOne({
      where: {
        name: { [Op.iLike]: classNameBase },
        department: department ? { [Op.iLike]: department } : null,
        schoolId: user.schoolId,
      },
      transaction,
    })) as any;
    if (!classRecord) {
      await transaction.rollback();
      return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
    }

    // Find teacher by teacherName
    const teacher = (await User.findOne({
      where: {
        [Op.or]: [
          { firstName: { [Op.iLike]: teacherName } },
          { lastName: { [Op.iLike]: teacherName } },
          {
            [Op.and]: [
              { firstName: { [Op.iLike]: teacherName.split(" ")[0] || "" } },
              { lastName: { [Op.iLike]: teacherName.split(" ")[1] || "" } },
            ],
          },
        ],
        schoolId: user.schoolId,
      },
      include: [Role],
      transaction,
    })) as any;
    if (!teacher || teacher.role?.title.toLowerCase() !== "teacher") {
      await transaction.rollback();
      return error(
        null,
        "Teacher not found or not a teacher",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Find subject by subjectName
    const subject = (await Subject.findOne({
      where: { name: { [Op.iLike]: subjectName }, schoolId: user.schoolId },
      transaction,
    })) as any;
    if (!subject) {
      await transaction.rollback();
      return error(null, "Subject not found", statusCodes.NOT_FOUND)(h);
    }

    // Check if user is authorized
    const teacherRole = (await Role.findOne({
      where: { title: { [Op.iLike]: "teacher" } },
      transaction,
    })) as any;
    if (!teacherRole) {
      await transaction.rollback();
      return error(null, "Teacher role not found", statusCodes.SERVER_ISSUE)(h);
    }
    if (user.role.title.toLowerCase() !== "super_admin") {
      if (
        user.role.priority > teacherRole.priority ||
        (user.id !== teacher.id && user.role.priority >= teacherRole.priority)
      ) {
        await transaction.rollback();
        return error(
          null,
          "Not authorized to schedule for other teachers",
          statusCodes.PERMISSION_DENIED
        )(h);
      }
      const hasPermission = (await user.$hasPermission({
        module: "class-schedule",
        action: "create",
        targetType: "school",
        targetId: user.schoolId,
      })) as any;
      if (!hasPermission) {
        await transaction.rollback();
        return error(
          null,
          "Not authorized to create class schedules",
          statusCodes.PERMISSION_DENIED
        )(h);
      }
    }

    // Validate date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      await transaction.rollback();
      return error(
        null,
        "Invalid date format. Use YYYY-MM-DD",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Check for time conflicts
    const conflictingSchedule = (await ClassSchedule.findOne({
      where: {
        [Op.and]: [
          { schoolId: user.schoolId },
          { date },
          {
            [Op.or]: [{ teacherId: teacher.id }, { classId: classRecord.id }],
          },
          {
            [Op.or]: [
              { startTime: { [Op.between]: [startTime, endTime] } },
              { endTime: { [Op.between]: [startTime, endTime] } },
              {
                [Op.and]: [
                  { startTime: { [Op.lte]: startTime } },
                  { endTime: { [Op.gte]: endTime } },
                ],
              },
              {
                [Op.and]: [
                  { startTime: { [Op.gte]: startTime } },
                  { endTime: { [Op.lte]: endTime } },
                ],
              },
            ],
          },
        ],
      },
      transaction,
    })) as any;
    if (conflictingSchedule) {
      await transaction.rollback();
      return error(
        null,
        "Time conflict: Teacher or class already scheduled on this date and time",
        statusCodes.CNFLICT
      )(h);
    }

    // Create schedule
    const schedule = (await ClassSchedule.create(
      {
        classId: classRecord.id,
        teacherId: teacher.id,
        subjectId: subject.id,
        date,
        startTime,
        endTime,
        schoolId: user.schoolId,
      },
      { transaction }
    )) as any;

    await transaction.commit();
    return success(
      {
        classScheduleId: schedule.id,
        classId: schedule.classId,
        className: classRecord.department
          ? `${classRecord.name} ${classRecord.department}`
          : classRecord.name,
        teacherId: schedule.teacherId,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        subjectId: schedule.subjectId,
        subjectName: subject.name,
        date: schedule.date,
        dayOfWeek: sequelize.literal(
          `DAYNAME(\`${schedule.getTableName()}\`.date)`
        ),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
      "Class schedule created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to create class schedule",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

