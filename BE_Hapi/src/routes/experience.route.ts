import type { ServerRoute } from "@hapi/hapi";
import {
  createExperience,
  deleteAllExperiences,
  deleteSingleExperience,
  getAllExperiences,
  getSingleExperience,
  updateExperience,
} from "../controllers/experience.controller";
import Joi from "joi";

const experienceRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/experiences",
    handler: createExperience,
    options: {
      auth: "jwt_access",
      description: "Create a new experience record for the current user",
      tags: ["api", "experiences"],
      payload: {
        output: "stream",
        parse: true,
        multipart: true,
        maxBytes: 10 * 1024 * 1024, // 10MB limit
      },
      validate: {
        payload: Joi.object({
          company: Joi.string().min(2).max(100).required(),
          position: Joi.string().min(2).max(100).required(),
          startDate: Joi.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .required(),
          endDate: Joi.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .allow(null),
          description: Joi.string().max(500).optional().allow(null),
          certificate: Joi.any().optional(),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/experiences",
    handler: getAllExperiences,
    options: {
      auth: "jwt_access",
      description: "List all experience records for the current user",
      tags: ["api", "experiences"],
    },
  },
  {
    method: "GET",
    path: "/experiences/{experienceId}",
    handler: getSingleExperience,
    options: {
      auth: "jwt_access",
      description: "Get details of a specific experience record",
      tags: ["api", "experiences"],
      validate: {
        params: Joi.object({
          experienceId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "PATCH",
    path: "/experiences/{experienceId}",
    handler: updateExperience,
    options: {
      auth: "jwt_access",
      description: "Update an experience record",
      tags: ["api", "experiences"],
      payload: {
        output: "stream",
        parse: true,
        multipart: true,
        maxBytes: 10 * 1024 * 1024, // 10MB limit
      },
      validate: {
        params: Joi.object({
          experienceId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          company: Joi.string().min(2).max(100).optional(),
          position: Joi.string().min(2).max(100).optional(),
          startDate: Joi.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          endDate: Joi.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .allow(null),
          description: Joi.string().max(500).optional().allow(null),
          certificate: Joi.any().optional(),
        }).min(1),
      },
    },
  },
  {
    method: "DELETE",
    path: "/experiences/{experienceId}",
    handler: deleteSingleExperience,
    options: {
      auth: "jwt_access",
      description: "Delete an experience record",
      tags: ["api", "experiences"],
      validate: {
        params: Joi.object({
          experienceId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "DELETE",
    path: "/experiences",
    handler: deleteAllExperiences,
    options: {
      auth: "jwt_access",
      description: "Delete all experience records for the current user",
      tags: ["api", "experiences"],
    },
  },
];

export default experienceRoutes;
