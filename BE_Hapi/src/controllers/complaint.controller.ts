import type { Request, ResponseToolkit } from "@hapi/hapi";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { db } from "db/db";

const { class: Class, complaint: Complaint, user: User } = db;

// Create Complaint
export const createComplaint = async (request: Request, h: ResponseToolkit) => {
  const { subject, description, className } = request.payload as {
    subject: string;
    description?: string;
    className?: string;
  };
  const { userId } = request.auth.credentials as any;
  // console.log(userId)

  try {
    const user = (await User.findByPk(userId)) as any;
    console.log(user);
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    let classId: string | null = null;
    if (className) {
      const classRecord = (await Class.findOne({
        where: { name: className, schoolId: user.schoolId },
      })) as any;
      if (!classRecord) {
        return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
      }
      classId = classRecord.id;
    }

    const complaint = (await Complaint.create({
      userId,
      schoolId: user.schoolId,
      subject,
      description,
      classId,
      status: "pending",
    })) as any;

    return success(
      {
        complaintId: complaint.id,
        userId: complaint.userId,
        schoolId: complaint.schoolId,
        classId: complaint.classId,
        subject: complaint.subject,
        description: complaint.description,
        status: complaint.status,
      },
      "Complaint created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to create complaint",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get All Complaints
export const getAllComplaints = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { className, own } = request.query as {
    className?: string;
    own?: boolean;
  };
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const where: any = { schoolId: user.schoolId };
    if (own) {
      where.userId = userId;
    } else if (className) {
      const classRecord = (await Class.findOne({
        where: { name: className, schoolId: user.schoolId },
      })) as any;
      if (!classRecord) {
        return success(
          [],
          "No complaints found for this class",
          statusCodes.SUCCESS
        )(h);
      }
      where.classId = classRecord.id;
    }

    const complaints = (await Complaint.findAll({
      where,
      attributes: [
        "id",
        "userId",
        "schoolId",
        "classId",
        "subject",
        "description",
        "status",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    })) as any;

    const response = complaints.map((complaint: any) => ({
      complaintId: complaint.id,
      userId: complaint.userId,
      userName: complaint.user
        ? `${complaint.user.firstName} ${complaint.user.lastName || ""}`.trim()
        : null,
      schoolId: complaint.schoolId,
      classId: complaint.classId,
      subject: complaint.subject,
      description: complaint.description,
      status: complaint.status,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
    }));

    return success(
      response,
      "Complaints retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve complaints",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Complaint
export const updateComplaint = async (request: Request, h: ResponseToolkit) => {
  const { complaintId } = request.params;
  const { subject, description, className, status } = request.payload as {
    subject?: string;
    description?: string;
    className?: string;
    status?: "pending" | "attened" | "resolved";
  };
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const complaint = (await Complaint.findOne({
      where: { id: complaintId, userId, schoolId: user.schoolId },
    })) as any;
    if (!complaint) {
      return error(null, "Complaint not found", statusCodes.NOT_FOUND)(h);
    }

    let classId: string | null = complaint.classId;
    if (className !== undefined) {
      classId = null;
      if (className) {
        const classRecord = (await Class.findOne({
          where: { name: className, schoolId: user.schoolId },
        })) as any;
        if (!classRecord) {
          return error(null, "Class not found", statusCodes.NOT_FOUND)(h);
        }
        classId = classRecord.id;
      }
    }

    await complaint.update({
      subject: subject || complaint.subject,
      description:
        description !== undefined ? description : complaint.description,
      classId,
      status: status || complaint.status,
    });

    return success(
      {
        complaintId: complaint.id,
        userId: complaint.userId,
        schoolId: complaint.schoolId,
        classId: complaint.classId,
        subject: complaint.subject,
        description: complaint.description,
        status: complaint.status,
      },
      "Complaint updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to update complaint",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Single Complaint
export const deleteSingleComplaint = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { complaintId } = request.params;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const complaint = (await Complaint.findOne({
      where: { id: complaintId, userId, schoolId: user.schoolId },
    })) as any;
    if (!complaint) {
      return error(null, "Complaint not found", statusCodes.NOT_FOUND)(h);
    }

    await complaint.destroy();

    return success(
      null,
      "Complaint deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to delete complaint",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
