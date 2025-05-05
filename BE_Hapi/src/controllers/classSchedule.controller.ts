import type { Request, ResponseToolkit } from "@hapi/hapi";
import { sequelize } from "../db/db";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { Op, literal } from "sequelize";
import type {
  ClassCreatePayload,
  ClassScheduleUpdatePayload,
} from "../interfaces/ClassInterfaces";
import { db } from "../db/db";

const {
  class: Class,
  classSchedule: ClassSchedule,
  role: Role,
  subject: Subject,
  user: User,
} = db;

// Create ClassSchedule
export const createClassSchedule = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { teacherName, subjectName, className, date, startTime, endTime } =
    request.payload as ClassCreatePayload;
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
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

    // Find teacher by teacherName
    const teacher = (await User.findOne({
      where: {
        [Op.or]: [
          { firstName: { [Op.eq]: teacherName } },
          { lastName: { [Op.eq]: teacherName } },
          {
            [Op.and]: [
              { firstName: { [Op.eq]: teacherName.split(" ")[0] || "" } },
              { lastName: { [Op.eq]: teacherName.split(" ")[1] || "" } },
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
      where: { name: { [Op.eq]: subjectName }, schoolId: user.schoolId },
      transaction,
    })) as any;
    if (!subject) {
      await transaction.rollback();
      return error(null, "Subject not found", statusCodes.NOT_FOUND)(h);
    }

    // Check if user is authorized
    const teacherRole = (await Role.findOne({
      where: { title: { [Op.eq]: "teacher" } },
      transaction,
    })) as any;
    if (!teacherRole) {
      await transaction.rollback();
      return error(null, "Teacher role not found", statusCodes.SERVER_ISSUE)(h);
    }

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

// Get All Class Schedules
export const getAllClassSchedules = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { userId } = request.auth.credentials as any;
  const { fromDate, toDate } = request.query as {
    fromDate?: string;
    toDate?: string;
  };

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    // Build where clause
    const where: any = { schoolId: user.schoolId };
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date[Op.gte] = fromDate;
      if (toDate) where.date[Op.lte] = toDate;
    }

    const schedules = (await ClassSchedule.findAll({
      where,
      attributes: [
        "id",
        "classId",
        "teacherId",
        "subjectId",
        "date",
        [literal("DAYNAME(date)"), "dayOfWeek"],
        "startTime",
        "endTime",
        "createdAt",
      ],
      include: [
        { model: Class, attributes: ["name", "department"] },
        {
          model: User,
          as: "teacher",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Subject, attributes: ["id", "name"] },
      ],
      order: [
        ["date", "ASC"],
        ["startTime", "ASC"],
      ],
    })) as any;

    const response = schedules.map((schedule: any) => ({
      classScheduleId: schedule.id,
      classId: schedule.classId,
      className: schedule.Class?.department
        ? `${schedule.Class.name} ${schedule.Class.department}`
        : schedule.Class?.name,
      teacherId: schedule.teacherId,
      teacherName: `${schedule.teacher?.firstName} ${schedule.teacher?.lastName}`,
      subjectId: schedule.subjectId,
      subjectName: schedule.Subject?.name,
      date: schedule.date,
      dayOfWeek: schedule.getDataValue("dayOfWeek"),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    }));

    return success(
      response,
      "Class schedules retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to list class schedules",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Specific Class Schedules
export const getSpecificClassSchedules = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { classId } = request.params;
  const { fromDate, toDate } = request.query as {
    fromDate?: string;
    toDate?: string;
  };
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const classRecord = (await Class.findByPk(classId)) as any;
    if (!classRecord || classRecord.schoolId !== user.schoolId) {
      return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
    }

    // Build where clause
    const where: any = { schoolId: user.schoolId, classId };
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date[Op.gte] = fromDate;
      if (toDate) where.date[Op.lte] = toDate;
    }

    const schedules = (await ClassSchedule.findAll({
      where,
      attributes: [
        "id",
        "classId",
        "teacherId",
        "subjectId",
        "date",
        [literal("DAYNAME(date)"), "dayOfWeek"],
        "startTime",
        "endTime",
        "createdAt",
      ],
      include: [
        { model: Class, attributes: ["name", "department"] },
        {
          model: User,
          as: "teacher",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Subject, attributes: ["id", "name"] },
      ],
      order: [
        ["date", "ASC"],
        ["startTime", "ASC"],
      ],
    })) as any;

    const response = schedules.map((schedule: any) => ({
      classScheduleId: schedule.id,
      classId: schedule.classId,
      className: schedule.Class?.department
        ? `${schedule.Class.name} ${schedule.Class.department}`
        : schedule.Class?.name,
      teacherId: schedule.teacherId,
      teacherName: `${schedule.teacher?.firstName} ${schedule.teacher?.lastName}`,
      subjectId: schedule.subjectId,
      subjectName: schedule.Subject?.name,
      date: schedule.date,
      dayOfWeek: schedule.getDataValue("dayOfWeek"),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    }));

    return success(
      response,
      "Class schedules retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve class schedules",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Single Class Schedule
export const getSingleClassSchedule = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { classId, classScheduleId } = request.params;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const classRecord = (await Class.findByPk(classId)) as any;
    if (!classRecord || classRecord.schoolId !== user.schoolId) {
      return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
    }

    const schedule = (await ClassSchedule.findOne({
      where: { id: classScheduleId, classId, schoolId: user.schoolId },
      attributes: [
        "id",
        "classId",
        "teacherId",
        "subjectId",
        "date",
        [literal("DAYNAME(date)"), "dayOfWeek"],
        "startTime",
        "endTime",
        "createdAt",
        "updatedAt",
      ],
      include: [
        { model: Class, attributes: ["name", "department"] },
        {
          model: User,
          as: "teacher",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Subject, attributes: ["id", "name"] },
      ],
    })) as any;

    if (!schedule) {
      return error(null, "Class schedule not found", statusCodes.NOT_FOUND)(h);
    }

    const response = {
      classScheduleId: schedule.id,
      classId: schedule.classId,
      className: schedule.Class?.department
        ? `${schedule.Class.name} ${schedule.Class.department}`
        : schedule.Class?.name,
      teacherId: schedule.teacherId,
      teacherName: `${schedule.teacher?.firstName} ${schedule.teacher?.lastName}`,
      subjectId: schedule.subjectId,
      subjectName: schedule.Subject?.name,
      date: schedule.date,
      dayOfWeek: schedule.getDataValue("dayOfWeek"),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    };

    return success(
      response,
      "Class schedule retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve class schedule",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Class Schedule
export const updateSingleClassSchedule = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { classId, classScheduleId } = request.params;
  const { teacherName, subjectName, date, startTime, endTime } =
    request.payload as ClassScheduleUpdatePayload;
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, { transaction })) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const classRecord = (await Class.findByPk(classId, { transaction })) as any;
    if (!classRecord || classRecord.schoolId !== user.schoolId) {
      await transaction.rollback();
      return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
    }

    const schedule = (await ClassSchedule.findOne({
      where: { id: classScheduleId, classId, schoolId: user.schoolId },
      include: [Class, Subject, { model: User, as: "teacher" }],
      transaction,
    })) as any;
    if (!schedule) {
      await transaction.rollback();
      return error(null, "Class schedule not found", statusCodes.NOT_FOUND)(h);
    }

    // Validate and update teacher
    let finalTeacherId = schedule.teacherId;
    let updatedTeacher = schedule.teacher;
    if (teacherName) {
      const teacher = (await User.findOne({
        where: {
          [Op.or]: [
            { firstName: { [Op.eq]: teacherName } },
            { lastName: { [Op.eq]: teacherName } },
            {
              [Op.and]: [
                { firstName: { [Op.eq]: teacherName.split(" ")[0] || "" } },
                { lastName: { [Op.eq]: teacherName.split(" ")[1] || "" } },
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
      finalTeacherId = teacher.id;
      updatedTeacher = teacher;
    }

    // Validate and update subject
    let finalSubjectId = schedule.subjectId;
    let updatedSubject = schedule.Subject;
    if (subjectName) {
      const subject = (await Subject.findOne({
        where: { name: { [Op.eq]: subjectName }, schoolId: user.schoolId },
        transaction,
      })) as any;
      if (!subject) {
        await transaction.rollback();
        return error(null, "Subject not found", statusCodes.NOT_FOUND)(h);
      }
      finalSubjectId = subject.id;
      updatedSubject = subject;
    }

    // Validate date
    let finalDate = schedule.date;
    if (date) {
      finalDate = date;
    }

    // Validate times
    let finalStartTime = schedule.startTime;
    let finalEndTime = schedule.endTime;
    if (startTime || endTime) {
      finalStartTime = startTime || finalStartTime;
      finalEndTime = endTime || finalEndTime;
    }

    // Check for time conflicts
    if (teacherName || date || startTime || endTime) {
      const conflictingSchedule = await ClassSchedule.findOne({
        where: {
          [Op.and]: [
            { schoolId: user.schoolId },
            { date: finalDate },
            {
              [Op.or]: [{ teacherId: finalTeacherId }, { classId }],
            },
            {
              [Op.or]: [
                { startTime: { [Op.between]: [finalStartTime, finalEndTime] } },
                { endTime: { [Op.between]: [finalStartTime, finalEndTime] } },
                {
                  [Op.and]: [
                    { startTime: { [Op.lte]: finalStartTime } },
                    { endTime: { [Op.gte]: finalEndTime } },
                  ],
                },
                {
                  [Op.and]: [
                    { startTime: { [Op.gte]: finalStartTime } },
                    { endTime: { [Op.lte]: finalEndTime } },
                  ],
                },
              ],
            },
            { id: { [Op.ne]: classScheduleId } },
          ],
        },
        transaction,
      });
      if (conflictingSchedule) {
        await transaction.rollback();
        return error(
          null,
          "Time conflict: Teacher or class already scheduled on this date and time",
          statusCodes.CNFLICT
        )(h);
      }
    }

    // Update schedule
    await schedule.update(
      {
        teacherId: finalTeacherId,
        subjectId: finalSubjectId,
        date: finalDate,
        startTime: finalStartTime,
        endTime: finalEndTime,
      },
      { transaction }
    );

    await transaction.commit();
    return success(
      {
        classScheduleId: schedule.id,
        classId: schedule.classId,
        className: classRecord.department
          ? `${classRecord.name} ${classRecord.department}`
          : classRecord.name,
        teacherId: schedule.teacherId,
        teacherName: `${updatedTeacher?.firstName} ${updatedTeacher?.lastName}`,
        subjectId: schedule.subjectId,
        subjectName: updatedSubject?.name,
        date: schedule.date,
        dayOfWeek: sequelize.literal(
          `DAYNAME(\`${schedule.getTableName()}\`.date)`
        ),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
      "Class schedule updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to update class schedule",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Single Class Schedule
export const deleteSingleClassSchedule = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { classId, classScheduleId } = request.params;
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, { transaction })) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const classRecord = (await Class.findByPk(classId, { transaction })) as any;
    if (!classRecord || classRecord.schoolId !== user.schoolId) {
      await transaction.rollback();
      return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
    }

    const schedule = (await ClassSchedule.findOne({
      where: { id: classScheduleId, classId, schoolId: user.schoolId },
      transaction,
    })) as any;
    if (!schedule) {
      await transaction.rollback();
      return error(null, "Class schedule not found", statusCodes.NOT_FOUND)(h);
    }

    await schedule.destroy({ transaction });

    await transaction.commit();
    return success(
      null,
      "Class schedule deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to delete class schedule",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete All Class Schedules
export const deleteAllClassSchedules = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, { transaction })) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    await ClassSchedule.destroy({
      where: { schoolId: user.schoolId },
      transaction,
    });

    await transaction.commit();
    return success(
      null,
      "All class schedules deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to delete class schedules",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
