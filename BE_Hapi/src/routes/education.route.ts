import type { ServerRoute } from "@hapi/hapi";
import {
  createEducation,
  deleteAllEducations,
  deleteSingleEducation,
  getAllEducations,
  getSingleEducation,
  updateEducation,
} from "../controllers/education.controller";
import Joi from "joi";

const educationRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/educations",
    handler: createEducation,
    options: {
      auth: "jwt_access",
      description: "Create a new education record for the current user",
      tags: ["api", "educations"],
      payload: {
        output: "stream",
        parse: true,
        multipart: true,
        maxBytes: 10 * 1024 * 1024, // 10MB limit
      },
      validate: {
        payload: Joi.object({
          institution: Joi.string().min(2).max(100).required(),
          degree: Joi.string().min(2).max(100).required(),
          fieldOfStudy: Joi.string().min(2).max(100).required(),
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
    path: "/educations",
    handler: getAllEducations,
    options: {
      auth: "jwt_access",
      description: "List all education records for the current user",
      tags: ["api", "educations"],
    },
  },
  {
    method: "GET",
    path: "/educations/{educationId}",
    handler: getSingleEducation,
    options: {
      auth: "jwt_access",
      description: "Get details of a specific education record",
      tags: ["api", "educations"],
      validate: {
        params: Joi.object({
          educationId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "PATCH",
    path: "/educations/{educationId}",
    handler: updateEducation,
    options: {
      auth: "jwt_access",
      description: "Update an education record",
      tags: ["api", "educations"],
      payload: {
        output: "stream",
        parse: true,
        multipart: true,
        maxBytes: 10 * 1024 * 1024, // 10MB limit
      },
      validate: {
        params: Joi.object({
          educationId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          institution: Joi.string().min(2).max(100).optional(),
          degree: Joi.string().min(2).max(100).optional(),
          fieldOfStudy: Joi.string().min(2).max(100).optional(),
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
    path: "/educations/{educationId}",
    handler: deleteSingleEducation,
    options: {
      auth: "jwt_access",
      description: "Delete an education record",
      tags: ["api", "educations"],
      validate: {
        params: Joi.object({
          educationId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "DELETE",
    path: "/educations",
    handler: deleteAllEducations,
    options: {
      auth: "jwt_access",
      description: "Delete all education records for the current user",
      tags: ["api", "educations"],
    },
  },
];

export default educationRoutes;
