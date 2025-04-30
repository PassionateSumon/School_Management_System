import type { Request, ResponseToolkit } from "@hapi/hapi";
import { success, error } from "../utils/returnFunctions.util";
import { School } from "../models/School.model";
import { statusCodes } from "../config/constants";
import { Degree } from "../models/Degree.model";

// Create Degree
export const createDegree = async (req: Request, h: ResponseToolkit) => {
  try {
    const { name, description, schoolId } = req.payload as any;

    const schoolExists = await School.findByPk(schoolId);
    if (!schoolExists) {
      return error(
        { error: "Invalid school" },
        "School not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    const existingDegree = await Degree.findOne({
      where: { name, schoolId },
    });
    if (existingDegree) {
      return error(
        { error: "Duplicate degree name" },
        "Degree name already exists for this school",
        statusCodes.BAD_REQUEST
      )(h);
    }

    const degree = await Degree.create({
      name,
      description: description || null,
      schoolId,
    });

    return success(
      { degree },
      "Degree created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to create degree",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// List Degrees
export const listDegrees = async (req: Request, h: ResponseToolkit) => {
  try {
    const { schoolId } = req.query as any;

    if (!schoolId) {
      return error(
        { error: "Missing schoolId" },
        "School ID is required",
        statusCodes.BAD_REQUEST
      )(h);
    }
    const schoolExists = await School.findByPk(schoolId);
    if (!schoolExists) {
      return error(
        { error: "Invalid school" },
        "School not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    const degrees = await Degree.findAll({
      where: { schoolId },
      include: [{ model: School, attributes: ["name"] }],
    });

    return success(
      { degrees },
      "Degrees retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to retrieve degrees",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Degree Details
export const getDegreeDetails = async (req: Request, h: ResponseToolkit) => {
  try {
    const { degreeId } = req.params;

    const degree = await Degree.findOne({
      where: { id: degreeId },
      include: [{ model: School, attributes: ["name"] }],
    });

    if (!degree) {
      return error(
        { error: "Degree not found" },
        "Degree not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    return success(
      { degree },
      "Degree details retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to retrieve degree details",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Degree
export const updateDegree = async (req: Request, h: ResponseToolkit) => {
  try {
    const { degreeId } = req.params;
    const { name, description, schoolId } = req.payload as any;

    const degree = (await Degree.findByPk(degreeId)) as any;
    if (!degree) {
      return error(
        { error: "Degree not found" },
        "Degree not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    if (schoolId && !(await School.findByPk(schoolId))) {
      return error(
        { error: "Invalid school" },
        "School not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    if (name && (name !== degree.name || schoolId !== degree.schoolId)) {
      const existingDegree = (await Degree.findOne({
        where: { name, schoolId: schoolId || degree.schoolId },
      })) as any;
      if (existingDegree && existingDegree.id !== degreeId) {
        return error(
          { error: "Duplicate degree name" },
          "Degree name already exists for this school",
          statusCodes.BAD_REQUEST
        )(h);
      }
    }

    await degree.update({
      name: name || degree.name,
      description: description !== undefined ? description : degree.description,
      schoolId: schoolId || degree.schoolId,
    });

    return success(
      { degree },
      "Degree updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to update degree",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Degree
export const deleteDegree = async (req: Request, h: ResponseToolkit) => {
  try {
    const { degreeId } = req.params;

    const degree = await Degree.findByPk(degreeId);
    if (!degree) {
      return error(
        { error: "Degree not found" },
        "Degree not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    const deletedDegree: any = await degree.destroy();
    if (!deletedDegree) {
      return error(
        { error: "Failed to delete degree" },
        "Degree deletion failed",
        statusCodes.SERVER_ISSUE
      )(h);
    }
    return success(
      { deletedDegree },
      "Degree deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to delete degree",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
