import type { Request, ResponseToolkit } from "@hapi/hapi";
import { sequelize } from "../db/db";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { uploadToClodinary, getCloudinaryPublicId } from "../config/cloudinary";
import { v2 as cloudinary } from "cloudinary";
import type {
  CreateEducationPayload,
  UpdateEducationPayload,
} from "../interfaces/EducationInterfaces";
import { db } from "../db/db";

const { education: Education, user: User } = db;

// Create Education
export const createEducation = async (request: Request, h: ResponseToolkit) => {
  const {
    institution,
    degree,
    fieldOfStudy,
    startDate,
    endDate,
    description,
    certificate,
  } = request.payload as CreateEducationPayload;
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, { transaction })) as any;
    if (!user) {
      await transaction.rollback();
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    let certificateUrl: string | null = null;
    if (certificate) {
      certificateUrl = await uploadToClodinary(certificate);
      if (!certificateUrl) {
        await transaction.rollback();
        return error(
          null,
          "Failed to upload certificate to Cloudinary",
          statusCodes.SERVER_ISSUE
        )(h);
      }
    }

    const education = (await Education.create(
      {
        userId,
        institution,
        degree,
        fieldOfStudy,
        startDate,
        endDate,
        description,
        certificate: certificateUrl,
      },
      { transaction }
    )) as any;

    await transaction.commit();
    return success(
      {
        educationId: education.id,
        userId: education.userId,
        institution: education.institution,
        degree: education.degree,
        fieldOfStudy: education.fieldOfStudy,
        startDate: education.startDate,
        endDate: education.endDate,
        description: education.description,
        certificate: education.certificate,
      },
      "Education created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to create education",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get All Educations
export const getAllEducations = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user) {
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    const educations = (await Education.findAll({
      where: { userId },
      attributes: [
        "id",
        "userId",
        "institution",
        "degree",
        "fieldOfStudy",
        "startDate",
        "endDate",
        "description",
        "certificate",
        "createdAt",
        "updatedAt",
      ],
    })) as any;

    const response = educations.map((education: any) => ({
      educationId: education.id,
      userId: education.userId,
      institution: education.institution,
      degree: education.degree,
      fieldOfStudy: education.fieldOfStudy,
      startDate: education.startDate,
      endDate: education.endDate,
      description: education.description,
      certificate: education.certificate,
    }));

    return success(
      response,
      "Educations retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve educations",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Single Education
export const getSingleEducation = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { educationId } = request.params;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user) {
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    const education = (await Education.findOne({
      where: { id: educationId, userId },
      attributes: [
        "id",
        "userId",
        "institution",
        "degree",
        "fieldOfStudy",
        "startDate",
        "endDate",
        "description",
        "certificate",
        "createdAt",
        "updatedAt",
      ],
    })) as any;

    if (!education) {
      return error(null, "Education not found", statusCodes.NOT_FOUND)(h);
    }

    return success(
      {
        educationId: education.id,
        userId: education.userId,
        institution: education.institution,
        degree: education.degree,
        fieldOfStudy: education.fieldOfStudy,
        startDate: education.startDate,
        endDate: education.endDate,
        description: education.description,
        certificate: education.certificate,
      },
      "Education retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve education",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Education
export const updateEducation = async (request: Request, h: ResponseToolkit) => {
  const { educationId } = request.params;
  const {
    institution,
    degree,
    fieldOfStudy,
    startDate,
    endDate,
    description,
    certificate,
  } = request.payload as UpdateEducationPayload;
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, { transaction })) as any;
    if (!user) {
      await transaction.rollback();
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    const education = (await Education.findOne({
      where: { id: educationId, userId },
      transaction,
    })) as any;
    if (!education) {
      await transaction.rollback();
      return error(null, "Education not found", statusCodes.NOT_FOUND)(h);
    }

    let certificateUrl = education.certificate;
    if (certificate) {
      // Delete old certificate from Cloudinary if it exists
      if (education.certificate) {
        const publicId = getCloudinaryPublicId(education.certificate);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
      // Upload new certificate
      certificateUrl = await uploadToClodinary(certificate);
      if (!certificateUrl) {
        await transaction.rollback();
        return error(
          null,
          "Failed to upload certificate to Cloudinary",
          statusCodes.SERVER_ISSUE
        )(h);
      }
    }

    await education.update(
      {
        institution: institution || education.institution,
        degree: degree || education.degree,
        fieldOfStudy: fieldOfStudy || education.fieldOfStudy,
        startDate: startDate || education.startDate,
        endDate: endDate !== undefined ? endDate : education.endDate,
        description:
          description !== undefined ? description : education.description,
        certificate: certificateUrl || education.certificate,
      },
      { transaction }
    );

    await transaction.commit();
    return success(
      {
        educationId: education.id,
        userId: education.userId,
        institution: education.institution,
        degree: education.degree,
        fieldOfStudy: education.fieldOfStudy,
        startDate: education.startDate,
        endDate: education.endDate,
        description: education.description,
        certificate: education.certificate,
      },
      "Education updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to update education",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Single Education
export const deleteSingleEducation = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { educationId } = request.params;
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, { transaction })) as any;
    if (!user) {
      await transaction.rollback();
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    const education = (await Education.findOne({
      where: { id: educationId, userId },
      transaction,
    })) as any;
    if (!education) {
      await transaction.rollback();
      return error(null, "Education not found", statusCodes.NOT_FOUND)(h);
    }

    // Delete certificate from Cloudinary if it exists
    if (education.certificate) {
      const publicId = getCloudinaryPublicId(education.certificate);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await education.destroy({ transaction });

    await transaction.commit();
    return success(
      null,
      "Education deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to delete education",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete All Educations
export const deleteAllEducations = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId, { transaction })) as any;
    if (!user) {
      await transaction.rollback();
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    const educations = (await Education.findAll({
      where: { userId },
      attributes: ["certificate"],
      transaction,
    })) as any;

    // Delete all associated certificates from Cloudinary
    for (const education of educations) {
      if (education.certificate) {
        const publicId = getCloudinaryPublicId(education.certificate);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    await Education.destroy({
      where: { userId },
      transaction,
    });

    await transaction.commit();
    return success(
      null,
      "All educations deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to delete educations",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
