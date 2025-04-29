import type { ServerRoute } from "@hapi/hapi";
import {
  createSubject,
  deleteAllSubjects,
  deleteSingleSubject,
  getAllSubjects,
  getSingleSubject,
  updateSubject,
} from "../controllers/subject.controller";
import Joi from "joi";

const subjectRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/subjects",
    handler: createSubject,
    options: {
      auth: "jwt_access",
      description: "Create a new subject",
      tags: ["api", "subjects"],
      validate: {
        payload: Joi.object({
          name: Joi.string().min(2).max(100).required(),
          schoolId: Joi.string().uuid().required(),
        }),
      },
      payload: {
        parse: true,
        output: "data",
      }
    },
  },
  {
    method: "GET",
    path: "/subjects",
    handler: getAllSubjects,
    options: {
      auth: "jwt_access",
      description: "List all subjects in the school",
      tags: ["api", "subjects"],
    },
  },
  {
    method: "GET",
    path: "/subjects/{subjectId}",
    handler: getSingleSubject,
    options: {
      auth: "jwt_access",
      description: "Get details of a specific subject",
      tags: ["api", "subjects"],
      validate: {
        params: Joi.object({
          subjectId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "PATCH",
    path: "/subjects/{subjectId}",
    handler: updateSubject,
    options: {
      auth: "jwt_access",
      description: "Update a subject",
      tags: ["api", "subjects"],
      validate: {
        params: Joi.object({
          subjectId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          name: Joi.string().min(2).max(100).optional(),
        }).min(1),
      },
    },
  },
  {
    method: "DELETE",
    path: "/subjects/{subjectId}",
    handler: deleteSingleSubject,
    options: {
      auth: "jwt_access",
      description: "Delete a subject",
      tags: ["api", "subjects"],
      validate: {
        params: Joi.object({
          subjectId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "DELETE",
    path: "/subjects",
    handler: deleteAllSubjects,
    options: {
      auth: "jwt_access",
      description: "Delete all subjects in the school",
      tags: ["api", "subjects"],
    },
  },
];

export default subjectRoutes;
