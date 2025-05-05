import type { Request, ResponseToolkit } from "@hapi/hapi";
import { v2 as cloudinary } from "cloudinary";
import { success, error } from "../utils/returnFunctions.util";
import { uploadToClodinary, getCloudinaryPublicId } from "../config/cloudinary";
import { statusCodes } from "../config/constants";
import { db } from "../db/db";

const {
  class: Class,
  department: Department,
  noticeBoard: NoticeBoard,
  school: School,
  user: User,
} = db;

// Create Notice
export const createNotice = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { notice, schoolId, classId, departmentId, status, file } =
      req.payload as any;

    // Validate schoolId, classId, departmentId
    const schoolExists = await School.findByPk(schoolId);
    if (!schoolExists) {
      return error(
        { error: "Invalid school" },
        "School not found",
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
    if (departmentId && !(await Department.findByPk(departmentId))) {
      return error(
        { error: "Invalid department" },
        "Department not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Upload file to Cloudinary if provided
    let fileUrl = null;
    if (file) {
      fileUrl = await uploadToClodinary(file);
      if (!fileUrl) {
        return error(
          { error: "File upload failed" },
          "Failed to upload file to Cloudinary",
          statusCodes.SERVER_ISSUE
        )(h);
      }
    }

    const noticeBoard = await NoticeBoard.create({
      notice,
      userId,
      schoolId,
      classId: classId || null,
      departmentId: departmentId || null,
      status,
      publishedAt: status === "Published" ? new Date() : null,
      file: fileUrl,
    });

    return success(
      { notice: noticeBoard },
      "Notice created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to create notice",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// List Notices
export const listNotices = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { schoolId, classId, departmentId, status } = req.query as any;

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

    const where: any = { schoolId };
    if (classId) {
      where.classId = classId;
      if (!(await Class.findByPk(classId))) {
        return error(
          { error: "Invalid class" },
          "Class not found",
          statusCodes.NOT_FOUND
        )(h);
      }
    }
    if (departmentId) {
      where.departmentId = departmentId;
      if (!(await Department.findByPk(departmentId))) {
        return error(
          { error: "Invalid department" },
          "Department not found",
          statusCodes.NOT_FOUND
        )(h);
      }
    }
    if (status) {
      where.status = status;
    } else {
      where.status = "Published"; // Default to Published for non-creators
      const isCreator = await NoticeBoard.findOne({ where: { userId } });
      if (isCreator) {
        delete where.status; // Creators see all statuses
      }
    }

    const notices = await NoticeBoard.findAll({
      where,
      include: [
        { model: School, attributes: ["name"], as: "school" },
        { model: Class, attributes: ["name"], as: "class", required: false },
        {
          model: Department,
          attributes: ["name"],
          as: "department",
          required: false,
        },
        { model: User, attributes: ["firstName", "lastName"], as: "user" },
      ],
    });

    return success(
      { notices },
      "Notices retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to retrieve notices",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Notice Details
export const getNoticeDetails = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { noticeId } = req.params;

    const notice = (await NoticeBoard.findOne({
      where: { id: noticeId },
      include: [
        { model: School, attributes: ["name"], as: "school" },
        { model: Class, attributes: ["name"], as: "class", required: false },
        {
          model: Department,
          attributes: ["name"],
          as: "department",
          required: false,
        },
        { model: User, attributes: ["firstName", "lastName"], as: "user" },
      ],
    })) as any;

    if (!notice) {
      return error(
        { error: "Notice not found" },
        "Notice not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Restrict draft/completed notices to creator
    if (notice.status !== "Published" && notice.userId !== userId) {
      return error(
        { error: "Unauthorized" },
        "Draft or Completed notices are only visible to the creator",
        statusCodes.BAD_REQUEST
      )(h);
    }

    return success(
      { notice },
      "Notice details retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to retrieve notice details",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Notice
export const updateNotice = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { noticeId } = req.params;
    const { notice, schoolId, classId, departmentId, status, file } =
      req.payload as any;

    const noticeBoard = (await NoticeBoard.findOne({
      where: { id: noticeId, userId },
    })) as any;
    if (!noticeBoard) {
      return error(
        { error: "Notice not found" },
        "Notice not found or unauthorized",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Validate schoolId, classId, departmentId
    if (schoolId && !(await School.findByPk(schoolId))) {
      return error(
        { error: "Invalid school" },
        "School not found",
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
    if (departmentId && !(await Department.findByPk(departmentId))) {
      return error(
        { error: "Invalid department" },
        "Department not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    let fileUrl = noticeBoard.file;
    if (file) {
      fileUrl = await uploadToClodinary(file);
      if (!fileUrl) {
        return error(
          { error: "File upload failed" },
          "Failed to upload file to Cloudinary",
          statusCodes.SERVER_ISSUE
        )(h);
      }
      if (noticeBoard.file) {
        const publicId = getCloudinaryPublicId(noticeBoard.file);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId).catch((err) => {
            console.error("Failed to delete old file from Cloudinary:", err);
          });
        }
      }
    }

    await noticeBoard.update({
      notice: notice || noticeBoard.notice,
      schoolId: schoolId || noticeBoard.schoolId,
      classId: classId !== undefined ? classId || null : noticeBoard.classId,
      departmentId:
        departmentId !== undefined
          ? departmentId || null
          : noticeBoard.departmentId,
      status: status || noticeBoard.status,
      publishedAt:
        status === "Published" && noticeBoard.status !== "Published"
          ? new Date()
          : noticeBoard.publishedAt,
      file: fileUrl,
    });

    return success(
      { notice: noticeBoard },
      "Notice updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to update notice",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Notice
export const deleteNotice = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { noticeId } = req.params;

    const notice = (await NoticeBoard.findOne({
      where: { id: noticeId, userId },
    })) as any;
    if (!notice) {
      return error(
        { error: "Notice not found" },
        "Notice not found or unauthorized",
        statusCodes.NOT_FOUND
      )(h);
    }

    if (notice.file) {
      const publicId = getCloudinaryPublicId(notice.file);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch((err) => {
          console.error("Failed to delete file from Cloudinary:", err);
        });
      }
    }

    await notice.destroy();

    return success({}, "Notice deleted successfully", statusCodes.SUCCESS)(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to delete notice",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
