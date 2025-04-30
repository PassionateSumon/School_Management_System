import type { ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import {
  createDegree,
  deleteDegree,
  getDegreeDetails,
  listDegrees,
  updateDegree,
} from "../controllers/degree.controller";
import { JWTUtil } from "../utils/jwtAll.util";
import { uuidSchema } from "./schemas/allSchemas";

const degreeRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/degrees",
    handler: createDegree,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        payload: Joi.object({
          name: Joi.string().min(1).max(255).required().messages({
            "string.min": "Degree name must be at least 1 character",
            "string.max": "Degree name cannot exceed 255 characters",
          }),
          description: Joi.string().allow("").optional(),
          schoolId: uuidSchema.label("schoolId"),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/degrees",
    handler: listDegrees,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        query: Joi.object({
          schoolId: uuidSchema.label("schoolId"),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/degrees/{degreeId}",
    handler: getDegreeDetails,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          degreeId: uuidSchema,
        }),
      },
    },
  },
  {
    method: "PUT",
    path: "/degrees/{degreeId}",
    handler: updateDegree,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          degreeId: uuidSchema,
        }),
        payload: Joi.object({
          name: Joi.string().min(1).max(255).optional().messages({
            "string.min": "Degree name must be at least 1 character",
            "string.max": "Degree name cannot exceed 255 characters",
          }),
          description: Joi.string().allow("").optional(),
          schoolId: uuidSchema.label("schoolId").optional(),
        }),
      },
    },
  },
  {
    method: "DELETE",
    path: "/degrees/{degreeId}",
    handler: deleteDegree,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          degreeId: uuidSchema,
        }),
      },
    },
  },
];

export default degreeRoutes;
