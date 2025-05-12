import type { Request, ResponseToolkit } from "@hapi/hapi";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { uploadToClodinary, getCloudinaryPublicId } from "../config/cloudinary";
import { v2 as cloudinary } from "cloudinary";
import type {
  CreateExperiencePayload,
  UpdateExperiencePayload,
} from "../interfaces/ExperienceInterfaces";
import { db } from "../db/db";

const { experience: Experience, user: User } = db;

// Create Experience
export const createExperience = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { company, position, startDate, endDate, description, certificate } =
    request.payload as CreateExperiencePayload;
  const { userId } = request.auth.credentials as any;
  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user) {
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    let certificateUrl: string | null = null;
    if (certificate) {
      certificateUrl = await uploadToClodinary(certificate);
      if (!certificateUrl) {
        return error(
          null,
          "Failed to upload certificate to Cloudinary",
          statusCodes.SERVER_ISSUE
        )(h);
      }
    }

    const experience = (await Experience.create({
      userId,
      company,
      position,
      startDate,
      endDate,
      description,
      certificate: certificateUrl,
    })) as any;

    return success(
      {
        experienceId: experience.id,
        userId: experience.userId,
        company: experience.company,
        position: experience.position,
        startDate: experience.startDate,
        endDate: experience.endDate,
        description: experience.description,
        certificate: experience.certificate,
      },
      "Experience created successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to create experience",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get All Experiences
export const getAllExperiences = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user) {
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    const experiences = (await Experience.findAll({
      where: { userId },
      attributes: [
        "id",
        "userId",
        "company",
        "position",
        "startDate",
        "endDate",
        "description",
        "certificate",
        "createdAt",
        "updatedAt",
      ],
    })) as any;

    const response = experiences.map((experience: any) => ({
      experienceId: experience.id,
      userId: experience.userId,
      company: experience.company,
      position: experience.position,
      startDate: experience.startDate,
      endDate: experience.endDate,
      description: experience.description,
      certificate: experience.certificate,
    }));

    return success(
      response,
      "Experiences retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve experiences",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Get Single Experience
export const getSingleExperience = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { experienceId } = request.params;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user) {
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    const experience = (await Experience.findOne({
      where: { id: experienceId, userId },
      attributes: [
        "id",
        "userId",
        "company",
        "position",
        "startDate",
        "endDate",
        "description",
        "certificate",
        "createdAt",
        "updatedAt",
      ],
    })) as any;

    if (!experience) {
      return error(null, "Experience not found", statusCodes.NOT_FOUND)(h);
    }

    return success(
      {
        experienceId: experience.id,
        userId: experience.userId,
        company: experience.company,
        position: experience.position,
        startDate: experience.startDate,
        endDate: experience.endDate,
        description: experience.description,
        certificate: experience.certificate,
      },
      "Experience retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to retrieve experience",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Update Experience
export const updateExperience = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { experienceId } = request.params;
  const { company, position, startDate, endDate, description, certificate } =
    request.payload as UpdateExperiencePayload;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user) {
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    const experience = (await Experience.findOne({
      where: { id: experienceId, userId },
    })) as any;
    if (!experience) {
      return error(null, "Experience not found", statusCodes.NOT_FOUND)(h);
    }

    let certificateUrl = experience.certificate;
    if (certificate) {
      // Delete old certificate from Cloudinary if it exists
      if (experience.certificate) {
        const publicId = getCloudinaryPublicId(experience.certificate);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
      // Upload new certificate
      certificateUrl = await uploadToClodinary(certificate);
      if (!certificateUrl) {
        return error(
          null,
          "Failed to upload certificate to Cloudinary",
          statusCodes.SERVER_ISSUE
        )(h);
      }
    }

    await experience.update({
      company: company || experience.company,
      position: position || experience.position,
      startDate: startDate || experience.startDate,
      endDate: endDate !== undefined ? endDate : experience.endDate,
      description:
        description !== undefined ? description : experience.description,
      certificate: certificateUrl || experience.certificate,
    });

    return success(
      {
        experienceId: experience.id,
        userId: experience.userId,
        company: experience.company,
        position: experience.position,
        startDate: experience.startDate,
        endDate: experience.endDate,
        description: experience.description,
        certificate: experience.certificate,
      },
      "Experience updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to update experience",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete Single Experience
export const deleteSingleExperience = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { experienceId } = request.params;
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user) {
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    const experience = (await Experience.findOne({
      where: { id: experienceId, userId },
    })) as any;
    if (!experience) {
      return error(null, "Experience not found", statusCodes.NOT_FOUND)(h);
    }

    // Delete certificate from Cloudinary if it exists
    if (experience.certificate) {
      const publicId = getCloudinaryPublicId(experience.certificate);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await experience.destroy();

    return success(
      null,
      "Experience deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to delete experience",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Delete All Experiences
export const deleteAllExperiences = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { userId } = request.auth.credentials as any;

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user) {
      return error(null, "User not found", statusCodes.NOT_FOUND)(h);
    }

    const experiences = (await Experience.findAll({
      where: { userId },
      attributes: ["certificate"],
    })) as any;

    // Delete all associated certificates from Cloudinary
    for (const experience of experiences) {
      if (experience.certificate) {
        const publicId = getCloudinaryPublicId(experience.certificate);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    await Experience.destroy({
      where: { userId },
    });

    return success(
      null,
      "All experiences deleted successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to delete experiences",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
