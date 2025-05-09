import { Request, ResponseToolkit } from "@hapi/hapi";
import { statusCodes } from "../config/constants";
import { success, error } from "../utils/returnFunctions.util";
import { db } from "db/db";

const {
  assignment: Assignment,
  class: Class,
  classStudent: ClassStudent,
  examSchedule: ExamSchedule,
  result: Result,
  role: Role,
  school: School,
  subject: Subject,
  user: User,
} = db;

// Create Result
export const createResult = async (req: Request, h: ResponseToolkit) => {
  try {
    const {
      studentId,
      schoolId,
      className,
      subjectName,
      assignmentId,
      examScheduleId,
      file,
      grade,
      maxPoints,
      obtainedPoints,
    } = req.payload as any;

    const { userId } = req.auth.credentials as any; // Authenticated teacher

    // Validate class and subject existence
    const classRecord = await Class.findOne({
      where: { name: className, schoolId },
    });
    if (!classRecord) {
      return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
    }
    const subject = await Subject.findOne({
      where: { name: subjectName, schoolId },
    });
    if (!subject) {
      return error(null, "Subject not found", statusCodes.NOT_FOUND)(h);
    }

    // Validate teacher authorization
    if (assignmentId) {
      const assignment = await Assignment.findOne({
        where: { id: assignmentId, teacherId: userId },
      });
      if (!assignment) {
        return error(
          null,
          "Teacher not authorized for this assignment",
          statusCodes.PERMISSION_DENIED
        )(h);
      }
    } else if (examScheduleId) {
      const examSchedule = await ExamSchedule.findOne({
        where: { id: examScheduleId, teacherId: userId },
      });
      if (!examSchedule) {
        return error(
          null,
          "Teacher not authorized for this exam schedule",
          statusCodes.PERMISSION_DENIED
        )(h);
      }
    } else {
      return error(
        null,
        "Either assignmentId or examScheduleId must be provided",
        statusCodes.BAD_REQUEST
      )(h);
    }

    const result = await Result.create({
      studentId,
      teacherId: userId,
      schoolId,
      classId: classRecord.id,
      subjectId: subject.id,
      assignmentId,
      examScheduleId,
      file,
      grade,
      maxPoints,
      obtainedPoints,
    });

    const populatedResult = await Result.findByPk(result.id, {
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: User,
          as: "teacher",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Class, as: "class", attributes: ["id", "name"] },
        { model: Subject, as: "subject", attributes: ["id", "name"] },
        { model: Assignment, as: "assignment", attributes: ["id", "title"] },
        { model: ExamSchedule, as: "examSchedule", attributes: ["id", "type"] },
      ],
    });

    return success(
      populatedResult,
      "Result created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to create result",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get All Results for a Class
export const getAllResults = async (req: Request, h: ResponseToolkit) => {
  try {
    const { classId, subjectId, assignmentId } = req.query;

    const classRecord = await Class.findByPk(classId);
    if (!classRecord) {
      return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
    }

    const where: any = { classId };
    if (subjectId) where.subjectId = subjectId;
    if (assignmentId) where.assignmentId = assignmentId;

    const results = await Result.findAll({
      where,
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: User,
          as: "teacher",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Class, as: "class", attributes: ["id", "name"] },
        { model: Subject, as: "subject", attributes: ["id", "name"] },
        { model: Assignment, as: "assignment", attributes: ["id", "title"] },
        { model: ExamSchedule, as: "examSchedule", attributes: ["id", "type"] },
      ],
    });

    return success(
      results,
      "Results retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve results",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Single Result
export const getSingleResult = async (req: Request, h: ResponseToolkit) => {
  try {
    const { id } = req.params;

    const result = await Result.findByPk(id, {
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: User,
          as: "teacher",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Class, as: "class", attributes: ["id", "name"] },
        { model: Subject, as: "subject", attributes: ["id", "name"] },
        { model: Assignment, as: "assignment", attributes: ["id", "title"] },
        { model: ExamSchedule, as: "examSchedule", attributes: ["id", "type"] },
      ],
    });

    if (!result) {
      return error(null, "Result not found", statusCodes.NOT_FOUND)(h);
    }

    return success(
      result,
      "Result retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve result",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Result
export const updateResult = async (req: Request, h: ResponseToolkit) => {
  try {
    const { id } = req.params;
    const {
      studentId,
      schoolId,
      className,
      subjectName,
      assignmentId,
      examScheduleId,
      file,
      grade,
      maxPoints,
      obtainedPoints,
    } = req.payload as any;
    
    const { userId } = req.auth.credentials as any; // Authenticated teacher

    const result = await Result.findByPk(id);
    if (!result) {
      return error(null, "Result not found", statusCodes.NOT_FOUND)(h);
    }

    // Validate class and subject if provided
    let classId = result.classId;
    let subjectId = result.subjectId;
    if (className && schoolId) {
      const classRecord = await Class.findOne({
        where: { name: className, schoolId },
      });
      if (!classRecord) {
        return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
      }
      classId = classRecord.id;
    }
    if (subjectName && schoolId) {
      const subject = await Subject.findOne({
        where: { name: subjectName, schoolId },
      });
      if (!subject) {
        return error(null, "Subject not found", statusCodes.NOT_FOUND)(h);
      }
      subjectId = subject.id;
    }

    // Validate teacher authorization
    if (assignmentId || result.assignmentId) {
      const assignment = await Assignment.findOne({
        where: { id: assignmentId || result.assignmentId, teacherId: userId },
      });
      if (!assignment) {
        return error(
          null,
          "Teacher not authorized for this assignment",
          statusCodes.PERMISSION_DENIED
        )(h);
      }
    } else if (examScheduleId || result.examScheduleId) {
      const examSchedule = await ExamSchedule.findOne({
        where: {
          id: examScheduleId || result.examScheduleId,
          invigilatorId: userId,
        },
      });
      if (!examSchedule) {
        return error(
          null,
          "Teacher not authorized for this exam schedule",
          statusCodes.PERMISSION_DENIED
        )(h);
      }
    } else {
      return error(
        null,
        "Either assignmentId or examScheduleId must be provided",
        statusCodes.BAD_REQUEST
      )(h);
    }

    await result.update({
      studentId: studentId || result.studentId,
      teacherId: userId,
      schoolId: schoolId || result.schoolId,
      classId,
      subjectId,
      assignmentId: assignmentId || result.assignmentId,
      examScheduleId: examScheduleId || result.examScheduleId,
      file: file || result.file,
      grade: grade || result.grade,
      maxPoints: maxPoints !== undefined ? maxPoints : result.maxPoints,
      obtainedPoints:
        obtainedPoints !== undefined ? obtainedPoints : result.obtainedPoints,
    });

    const populatedResult = await Result.findByPk(id, {
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: User,
          as: "teacher",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Class, as: "class", attributes: ["id", "name"] },
        { model: Subject, as: "subject", attributes: ["id", "name"] },
        { model: Assignment, as: "assignment", attributes: ["id", "title"] },
        { model: ExamSchedule, as: "examSchedule", attributes: ["id", "type"] },
      ],
    });

    return success(
      populatedResult,
      "Result updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to update result",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Result
export const deleteResult = async (req: Request, h: ResponseToolkit) => {
  try {
    const { id } = req.params;

    const result = await Result.findByPk(id);
    if (!result) {
      return error(null, "Result not found", statusCodes.NOT_FOUND)(h);
    }

    await result.destroy();

    return success(null, "Result deleted successfully", statusCodes.SUCCESS)(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to delete result",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
