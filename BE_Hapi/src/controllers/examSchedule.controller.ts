import type { Request, ResponseToolkit } from "@hapi/hapi";
import { statusCodes } from "../config/constants";
import { error, success } from "../utils/returnFunctions.util";
import { Op } from "sequelize";
import { db } from "../db/db";

const {
  class: Class,
  classSchedule: ClassSchedule,
  classStudent: ClassStudent,
  examSchedule: ExamSchedule,
  school: School,
  subject: Subject,
  user: User,
} = db;

// Create Exam
export const createExam = async (req: Request, h: ResponseToolkit) => {
  try {
    const {
      classId,
      schoolId,
      invigilatorId,
      subjectId,
      date,
      type,
      startTime,
      endTime,
      roomNo,
    } = req.payload as any;
    // console.log(req.payload)

    const schoolExists = await School.findByPk(schoolId);
    if (!schoolExists) {
      return error(
        { error: "Invalid school" },
        "School not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    // console.log(schoolExists)
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      return error(
        { error: "Invalid class" },
        "Class not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    // console.log(classExists)
    if (invigilatorId && !(await User.findByPk(invigilatorId))) {
      return error(
        { error: "Invalid invigilator" },
        "Invigilator not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    const subjectExists = await Subject.findByPk(subjectId);
    if (!subjectExists) {
      return error(
        { error: "Invalid subject" },
        "Subject not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    // console.log(subjectExists)

    // console.log(classId, schoolId, invigilatorId || null, subjectId, date, type, startTime, endTime, roomNo);
    const exam = await ExamSchedule.create({
      classId,
      schoolId,
      invigilatorId: invigilatorId || null,
      subjectId,
      date,
      type,
      startTime,
      endTime,
      roomNo,
    });
    // console.log(exam)

    return success(
      { exam },
      "Exam created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to create exam",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get all exams
export const getAllExams = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { className, type } = req.query as any;

    // Get user's affiliations
    const user = (await User.findByPk(userId, {
      attributes: ["schoolId"],
    })) as any;
    if (!user || !user.schoolId) {
      return error(
        { error: "User not affiliated" },
        "User not affiliated with a school",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Build where clause
    const where: any = { schoolId: user.schoolId };

    if (className) {
      const classRecord = (await Class.findOne({
        where: { name: className, schoolId: user.schoolId },
      })) as any;
      if (!classRecord) {
        return error(
          { error: "Invalid class" },
          "Class not found",
          statusCodes.NOT_FOUND
        )(h);
      }
      where.classId = classRecord.id;
    }

    if (type) {
      where.type = type;
    }

    // If no class filter, limit to user's affiliations
    if (!className) {
      const studentClasses = await ClassStudent.findAll({
        where: { studentId: userId },
        attributes: ["classId"],
      });
      const teacherClasses = await ClassSchedule.findAll({
        where: { teacherId: userId },
        attributes: ["id"],
      });
      const classIds = [
        ...studentClasses.map((sc: any) => sc.classId),
        ...teacherClasses.map((tc: any) => tc.id),
      ];
      // If user is not a student or teacher, allow all exams in school (for admins)
      if (classIds.length > 0) {
        where.classId = { [Op.in]: classIds };
      }
    }

    // console.log("Get all exams --> 155 --> ", where);

    // Fetch exams
    const exams = await ExamSchedule.findAll({
      where,
      include: [
        { model: School, attributes: ["name"], as: "School" },
        { model: Class, attributes: ["name"], as: "Class" },
        {
          model: User,
          attributes: ["firstName", "lastName"],
          as: "invigilator",
          required: false,
        },
        { model: Subject, attributes: ["name"], as: "Subject" },
      ],
    });
    console.log(exams)

    return success(
      { exams },
      "Exams retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to retrieve exams",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Single Exam
export const getSingleExam = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { examId } = req.params;

    const user = (await User.findByPk(userId, {
      attributes: ["schoolId"],
    })) as any;
    if (!user || !user.schoolId) {
      return error(
        { error: "User not affiliated" },
        "User not affiliated with a school",
        statusCodes.BAD_REQUEST
      )(h);
    }

    const exam = (await ExamSchedule.findOne({
      where: { id: examId, schoolId: user.schoolId },
      include: [
        { model: School, attributes: ["name"], as: "School" },
        { model: Class, attributes: ["name"], as: "Class" },
        {
          model: User,
          attributes: ["firstName", "lastName"],
          as: "invigilator",
          required: false,
        },
        { model: Subject, attributes: ["name"], as: "Subject" },
      ],
    })) as any;

    if (!exam) {
      return error(
        { error: "Exam not found" },
        "Exam not found or unauthorized",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Check visibility (students: ClassStudent, teachers: Class.teacherId, others: schoolId)
    const studentClasses = (await ClassStudent.findAll({
      where: { studentId: userId },
      attributes: ["classId"],
    })) as any;
    const teacherClasses = (await Class.findAll({
      where: { teacherId: userId },
      attributes: ["id"],
    })) as any;
    const classIds = [
      ...studentClasses.map((sc: any) => sc.classId),
      ...teacherClasses.map((tc: any) => tc.id),
    ];
    if (classIds.length > 0 && !classIds.includes(exam.classId)) {
      return error(
        { error: "Unauthorized" },
        "Exam not visible to user",
        statusCodes.BAD_REQUEST
      )(h);
    }

    return success(
      { exam },
      "Exam retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to retrieve exam",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Exam
export const updateExam = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { examId } = req.params;
    const {
      classId,
      invigilatorId,
      subjectId,
      date,
      type,
      startTime,
      endTime,
      roomNo,
    } = req.payload as any;

    const user = (await User.findByPk(userId, {
      attributes: ["schoolId"],
    })) as any;
    if (!user || !user.schoolId) {
      return error(
        { error: "User not affiliated" },
        "User not affiliated with a school",
        statusCodes.BAD_REQUEST
      )(h);
    }

    const exam = (await ExamSchedule.findOne({
      where: { id: examId, schoolId: user.schoolId },
    })) as any;
    if (!exam) {
      return error(
        { error: "Exam not found" },
        "Exam not found or unauthorized",
        statusCodes.NOT_FOUND
      )(h);
    }

    if (classId && !(await Class.findByPk(classId))) {
      return error(
        { error: "Invalid class" },
        "Class not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    if (invigilatorId && !(await User.findByPk(invigilatorId))) {
      return error(
        { error: "Invalid invigilator" },
        "Invigilator not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    if (subjectId && !(await Subject.findByPk(subjectId))) {
      return error(
        { error: "Invalid subject" },
        "Subject not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Validate endTime > startTime
    const finalStartTime = startTime || exam.startTime;
    const finalEndTime = endTime || exam.endTime;
    if (finalStartTime >= finalEndTime) {
      return error(
        { error: "Invalid time" },
        "End time must be greater than start time",
        statusCodes.BAD_REQUEST
      )(h);
    }

    await exam.update({
      classId: classId || exam.classId,
      schoolId: exam.schoolId,
      invigilatorId:
        invigilatorId !== undefined
          ? invigilatorId || null
          : exam.invigilatorId,
      subjectId: subjectId || exam.subjectId,
      date: date || exam.date,
      type: type || exam.type,
      startTime: startTime || exam.startTime,
      endTime: endTime || exam.endTime,
      roomNo: roomNo || exam.roomNo,
    });

    return success(
      { exam },
      "Exam updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to update exam",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Exam
export const deleteExam = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { examId } = req.params;

    const user = (await User.findByPk(userId, {
      attributes: ["schoolId"],
    })) as any;
    if (!user || !user.schoolId) {
      return error(
        { error: "User not affiliated" },
        "User not affiliated with a school",
        statusCodes.BAD_REQUEST
      )(h);
    }

    const exam = (await ExamSchedule.findOne({
      where: { id: examId, schoolId: user.schoolId },
    })) as any;
    if (!exam) {
      return error(
        { error: "Exam not found" },
        "Exam not found or unauthorized",
        statusCodes.NOT_FOUND
      )(h);
    }

    await exam.destroy();

    return success({}, "Exam deleted successfully", statusCodes.SUCCESS)(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to delete exam",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
