import type { Request, ResponseToolkit } from "@hapi/hapi";
import { Subject } from "../models/Subject.model";
import { User } from "../models/User.model";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { Op } from "sequelize";

// Create Subject
export const createSubject = async (request: Request, h: ResponseToolkit) => {
  const { name, schoolId } = request.payload as {
    name: string;
    schoolId: string;
  };
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const existingSubject = (await Subject.findOne({
      where: { name: { [Op.eq]: name }, schoolId },
    })) as any;
    if (existingSubject) {
      return error(null, "Subject already exists", statusCodes.CNFLICT)(h);
    }

    const subject = (await Subject.create({
      name,
      schoolId,
    })) as any;

    return success(
      {
        subjectId: subject.id,
        name: subject.name,
        schoolId: subject.schoolId,
      },
      "Subject created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to create subject",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get All Subjects
export const getAllSubjects = async (request: Request, h: ResponseToolkit) => {
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const subjects = (await Subject.findAll({
      where: { schoolId: user.schoolId },
      attributes: ["id", "name", "schoolId", "createdAt", "updatedAt"],
    })) as any;

    const response = subjects.map((subject: any) => ({
      subjectId: subject.id,
      name: subject.name,
      schoolId: subject.schoolId,
    }));

    return success(
      response,
      "Subjects retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve subjects",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Single Subject
export const getSingleSubject = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { subjectId } = request.params;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const subject = (await Subject.findOne({
      where: { id: subjectId, schoolId: user.schoolId },
      attributes: ["id", "name", "schoolId", "createdAt", "updatedAt"],
    })) as any;

    if (!subject) {
      return error(null, "Subject not found", statusCodes.NOT_FOUND)(h);
    }

    return success(
      {
        subjectId: subject.id,
        name: subject.name,
        schoolId: subject.schoolId,
      },
      "Subject retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve subject",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Subject
export const updateSubject = async (request: Request, h: ResponseToolkit) => {
  const { subjectId } = request.params;
  const { name } = request.payload as { name?: string };
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const subject = (await Subject.findOne({
      where: { id: subjectId, schoolId: user.schoolId },
    })) as any;
    if (!subject) {
      return error(null, "Subject not found", statusCodes.NOT_FOUND)(h);
    }

    if (name) {
      const existingSubject = await Subject.findOne({
        where: {
          name: { [Op.eq]: name },
          schoolId: user.schoolId,
          id: { [Op.ne]: subjectId },
        },
      });
      if (existingSubject) {
        return error(
          null,
          "Subject name already exists",
          statusCodes.CNFLICT
        )(h);
      }
    }

    await subject.update({ name: name || subject.name });

    return success(
      {
        subjectId: subject.id,
        name: subject.name,
        schoolId: subject.schoolId,
      },
      "Subject updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to update subject",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Single Subject
export const deleteSingleSubject = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { subjectId } = request.params;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const subject = (await Subject.findOne({
      where: { id: subjectId, schoolId: user.schoolId },
    })) as any;
    if (!subject) {
      return error(null, "Subject not found", statusCodes.NOT_FOUND)(h);
    }

    await subject.destroy();

    return success(
      null,
      "Subject deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to delete subject",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete All Subjects
export const deleteAllSubjects = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    await Subject.destroy({
      where: { schoolId: user.schoolId },
    });

    return success(
      null,
      "All subjects deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to delete subjects",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
