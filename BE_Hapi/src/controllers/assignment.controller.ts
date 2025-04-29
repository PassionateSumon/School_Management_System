import type { Request, ResponseToolkit } from "@hapi/hapi";
import { Class } from "../models/Class.model";
import { Subject } from "../models/Subject.model";
import { School } from "../models/School.model";
import { Assignment } from "../models/Assignment.model";
import { User } from "../models/User.model";
import { ClassStudent } from "../models/ClassStudent.model";
import { Op } from "sequelize";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { StudentAssignment } from "../models/StudentAssignment.model";
import { getCloudinaryPublicId, uploadToClodinary } from "../config/cloudinary";
import { v2 as cloudinary } from "cloudinary";

// create the assignment
export const createAssignment = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const {
      title,
      description,
      dueDate,
      file,
      classId,
      subjectId,
      schoolId,
      status = "draft",
      maxPoints = 100,
    } = req.payload as any;

    // Validate classId, subjectId, schoolId
    const classExists = classId ? await Class.findByPk(classId) : true;
    const subjectExists = await Subject.findByPk(subjectId);
    const schoolExists = await School.findByPk(schoolId);

    if (!classExists) {
      return error(
        { error: "Invalid class" },
        "Class not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    if (!subjectExists) {
      return error(
        { error: "Invalid subject" },
        "Subject not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    if (!schoolExists) {
      return error(
        { error: "Invalid school" },
        "School not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    let fileURL: string | null = null;
    if (file) {
      fileURL = await uploadToClodinary(file);
      if (!fileURL) {
        return error(
          { error: "File upload failed" },
          "Failed to upload file to Cloudinary",
          statusCodes.SERVER_ISSUE
        )(h);
      }
    }

    const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      fileURL,
      teacherId: userId,
      classId: classId || null, // Null for school-wide
      schoolId,
      subjectId,
      status,
      maxPoints,
    });

    return success(
      { assignment },
      "Assignment created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to create assignment",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// view assignments
export const getAssignments = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    // Get user's schoolId
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
    const schoolId = user.schoolId;

    // Get classes the user is enrolled in (if a student)
    const studentClasses = await ClassStudent.findAll({
      where: { studentId: userId },
      attributes: ["classId"],
    });
    const classIds = studentClasses.map((sc: any) => sc.classId);

    // Fetch assignments based on user’s affiliation
    const assignments = await Assignment.findAll({
      where: {
        [Op.or]: [
          { classId: { [Op.in]: classIds } }, // Student in class
          { teacherId: userId }, // Teacher who created it
          { classId: null, schoolId }, // School-wide assignments
        ],
      },
      include: [{ model: Subject, attributes: ["name", "code"] }],
    });

    return success(
      { assignments },
      "Assignments retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to retrieve assignments",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Assignment Details
export const getAssignmentDetails = async (
  req: Request,
  h: ResponseToolkit
) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { assignmentId } = req.params;

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
    const schoolId = user.schoolId;

    // Get classes the user is enrolled in (if a student)
    const studentClasses = await ClassStudent.findAll({
      where: { studentId: userId },
      attributes: ["classId"],
    });
    const classIds = studentClasses.map((sc: any) => sc?.classId);

    const assignment = (await Assignment.findOne({
      where: {
        id: assignmentId,
        [Op.or]: [
          { classId: { [Op.in]: classIds } }, // Student in class
          { teacherId: userId }, // Teacher who created it
          { classId: null, schoolId }, // School-wide assignments
        ],
      },
      include: [{ model: Subject, attributes: ["name", "code"] }],
    })) as any;

    if (!assignment) {
      return error(
        { error: "Assignment not found" },
        "Assignment not found or unauthorized",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Students only see published assignments, others see all
    if (
      !classIds.includes(assignment.classId) &&
      assignment.teacherId !== userId &&
      assignment.status !== "published"
    ) {
      return error(
        { error: "Draft assignment" },
        "Draft assignments are only visible to the creator",
        statusCodes.BAD_REQUEST
      )(h);
    }

    return success(
      { assignment },
      "Assignment details retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to retrieve assignment details",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Assignment
export const updateAssignment = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { assignmentId } = req.params;
    const {
      title,
      description,
      dueDate,
      file,
      classId,
      subjectId,
      schoolId,
      status,
      maxPoints,
    } = req.payload as any;

    // Find assignment and verify creator
    const assignment = (await Assignment.findOne({
      where: { id: assignmentId, teacherId: userId },
    })) as any;
    if (!assignment) {
      return error(
        { error: "Assignment not found" },
        "Assignment not found or unauthorized",
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
    if (subjectId && !(await Subject.findByPk(subjectId))) {
      return error(
        { error: "Invalid subject" },
        "Subject not found",
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

    let fileURL = assignment.fileURL;
    if (file) {
      // Upload new file
      fileURL = await uploadToClodinary(file);
      if (!fileURL) {
        return error(
          { error: "File upload failed" },
          "Failed to upload file to Cloudinary",
          statusCodes.SERVER_ISSUE
        )(h);
      }

      // Delete old file from Cloudinary if it exists
      if (assignment.fileURL) {
        const publicId = getCloudinaryPublicId(assignment.fileURL);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId).catch((err) => {
            console.error("Failed to delete old file from Cloudinary:", err);
          });
        }
      }
    }

    // Update assignment with provided fields
    await assignment.update({
      title: title || assignment.title,
      description:
        description !== undefined ? description : assignment.description,
      dueDate: dueDate || assignment.dueDate,
      fileURL: fileURL || assignment.fileURL,
      classId: classId !== undefined ? classId || null : assignment.classId,
      subjectId: subjectId || assignment.subjectId,
      schoolId: schoolId || assignment.schoolId,
      status: status || assignment.status,
      maxPoints: maxPoints || assignment.maxPoints,
    });

    return success(
      { assignment },
      "Assignment updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to update assignment",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Assignment
export const deleteAssignment = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { assignmentId } = req.params;

    // Find assignment and verify creator
    const assignment = (await Assignment.findOne({
      where: { id: assignmentId, teacherId: userId },
    })) as any;
    if (!assignment) {
      return error(
        { error: "Assignment not found" },
        "Assignment not found or unauthorized",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Delete file from Cloudinary if it exists
    if (assignment.fileURL) {
      const publicId = getCloudinaryPublicId(assignment.fileURL);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId).catch((err) => {
          console.error("Failed to delete file from Cloudinary:", err);
        });
      }
    }

    await assignment.destroy();

    return success(
      {},
      "Assignment deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to delete assignment",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Submit an Assignment (usually by students)
export const submitAssignment = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { assignmentId, submissionFileUrl, submissionText } =
      req.payload as any;

    // Verify assignment exists and is not past due
    const assignment = (await Assignment.findByPk(assignmentId)) as any;
    if (!assignment) {
      return error(
        { error: "Invalid assignment" },
        "Assignment not found",
        statusCodes.NOT_FOUND
      )(h);
    }
    if (new Date(assignment.dueDate) < new Date()) {
      return error(
        { error: "Expired assignment" },
        "Assignment submission deadline passed",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Create or update submission
    const [submission, created] = (await StudentAssignment.findOrCreate({
      where: { studentId: userId, assignmentId },
      defaults: {
        studentId: userId,
        assignmentId,
        hasSubmitted: true,
        submittedAt: new Date(),
        submissionFileUrl,
        submissionText,
      },
    })) as any;

    if (!created) {
      // Update existing submission if edit is approved
      if (submission.editApproved) {
        await submission.update({
          submissionFileUrl,
          submissionText,
          hasSubmitted: true,
          submittedAt: new Date(),
          editedAt: new Date(),
        });
      } else {
        return error(
          { error: "Edit not approved" },
          "Submission edit not allowed",
          statusCodes.BAD_REQUEST
        )(h);
      }
    }

    return success(
      { submission },
      "Assignment submitted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to submit assignment",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Submission Details (for now tecaher can see all submissions for him/her)
export const getSubmissions = async (req: Request, h: ResponseToolkit) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { assignmentId } = req.params;

    // Verify assignment exists and belongs to teacher
    const assignment = await Assignment.findOne({
      where: { id: assignmentId, teacherId: userId },
    });
    if (!assignment) {
      return error(
        { error: "Invalid assignment" },
        "Assignment not found or unauthorized",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Fetch submissions with student details
    const submissions = await StudentAssignment.findAll({
      where: { assignmentId, hasSubmitted: true },
      include: [
        {
          model: User,
          attributes: ["firstName", "lastName", "rollNumber", "email"],
        },
      ],
    });

    return success(
      { submissions },
      "Submissions retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to retrieve submissions",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Student’s Submission
export const getStudentSubmission = async (
  req: Request,
  h: ResponseToolkit
) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { assignmentId } = req.params;

    // Verify assignment exists
    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      return error(
        { error: "Assignment not found" },
        "Assignment not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Fetch student's submission
    const submission = await StudentAssignment.findOne({
      where: { studentId: userId, assignmentId },
      include: [
        {
          model: User,
          attributes: ["firstName", "lastName", "rollNumber", "email"],
        },
      ],
    });

    if (!submission) {
      return error(
        { error: "Submission not found" },
        "No submission found for this assignment",
        statusCodes.NOT_FOUND
      )(h);
    }

    return success(
      { submission },
      "Submission retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to retrieve submission",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Manage Submission Edit (handles student edit requests and teacher approvals)
export const manageSubmissionEdit = async (
  req: Request,
  h: ResponseToolkit
) => {
  try {
    const { userId } = req.auth.credentials as any;
    const { assignmentId, studentId } = req.params;
    const { editRequested, editApproved } = req.payload as any;

    // Verify assignment exists
    const assignment = (await Assignment.findByPk(assignmentId)) as any;
    if (!assignment) {
      return error(
        { error: "Assignment not found" },
        "Assignment not found",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Find submission
    const submission = (await StudentAssignment.findOne({
      where: { studentId, assignmentId },
    })) as any;
    if (!submission) {
      return error(
        { error: "Submission not found" },
        "No submission found for this student",
        statusCodes.NOT_FOUND
      )(h);
    }

    // Handle student requesting edit
    if (editRequested !== undefined && studentId === userId) {
      // Student requesting or cancelling edit request
      await submission.update({ editRequested });
      return success(
        { submission },
        `Edit request ${
          editRequested ? "submitted" : "cancelled"
        } successfully`,
        statusCodes.SUCCESS
      )(h);
    }
    // Handle teacher approving/rejecting edit
    else if (editApproved !== undefined && assignment.teacherId === userId) {
      // Teacher approving or rejecting edit
      await submission.update({ editApproved, editRequested: false });
      return success(
        { submission },
        `Edit ${editApproved ? "approved" : "rejected"} successfully`,
        statusCodes.SUCCESS
      )(h);
    } else {
      return error(
        { error: "Invalid action" },
        "Invalid edit request or approval action",
        statusCodes.BAD_REQUEST
      )(h);
    }
  } catch (err: any) {
    return error(
      { error: err.message },
      "Failed to manage submission edit",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
