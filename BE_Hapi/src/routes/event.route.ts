import type { ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import {
  optionalUuidSchema,
  scopeSchema,
  uuidSchema,
} from "./schemas/allSchemas";
import {
  createEvent,
  deleteEvent,
  getEventDetails,
  listEvents,
  updateEvent,
} from "../controllers/event.controller";
import { JWTUtil } from "../utils/jwtAll.util";

const eventRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/events",
    handler: createEvent,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        payload: Joi.object({
          title: Joi.string().min(1).max(255).required().messages({
            "string.min": "Title must be at least 1 character",
            "string.max": "Title cannot exceed 255 characters",
          }),
          description: Joi.string().allow("").optional(),
          date: Joi.date().iso().required().messages({
            "date.format": "Date must be in ISO format",
          }),
          startTime: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required()
            .messages({
              "string.pattern.base":
                "Start time must be in HH:MM format (24-hour)",
            }),
          classId: optionalUuidSchema.label("classId"),
          schoolId: uuidSchema.label("schoolId"),
          departmentId: optionalUuidSchema.label("departmentId"),
          scope: scopeSchema,
          link: Joi.string().uri().max(500).optional().allow("").messages({
            "string.uri": "Link must be a valid URL",
            "string.max": "Link cannot exceed 500 characters",
          }),
        }),
        failAction: (request, h, err: any) => {
          // console.log(err);
          const errorMessage =
            err?.details?.[0]?.message || "Invalid request payload.";
          return h
            .response({ status: "Failed", error: errorMessage })
            .code(400)
            .takeover();
        },
      },
      payload: {
        parse: true,
        output: "data",
      }
    },
  },
  {
    method: "GET",
    path: "/events",
    handler: listEvents,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        query: Joi.object({
          schoolId: optionalUuidSchema.label("schoolId"),
          classId: optionalUuidSchema.label("classId"),
          departmentId: optionalUuidSchema.label("departmentId"),
          scope: scopeSchema.optional(),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/events/{eventId}",
    handler: getEventDetails,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          eventId: uuidSchema,
        }),
        query: Joi.object({
          schoolId: optionalUuidSchema.label("schoolId"),
          classId: optionalUuidSchema.label("classId"),
          departmentId: optionalUuidSchema.label("departmentId"),
          scope: scopeSchema.optional(),
        }),
      },
    },
  },
  {
    method: "PUT",
    path: "/events/{eventId}",
    handler: updateEvent,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          eventId: uuidSchema,
        }),
        payload: Joi.object({
          title: Joi.string().min(1).max(255).optional().messages({
            "string.min": "Title must be at least 1 character",
            "string.max": "Title cannot exceed 255 characters",
          }),
          description: Joi.string().allow("").optional(),
          date: Joi.date().iso().optional().messages({
            "date.format": "Date must be in ISO format",
          }),
          startTime: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .optional()
            .messages({
              "string.pattern.base":
                "Start time must be in HH:MM format (24-hour)",
            }),
          classId: optionalUuidSchema.label("classId").optional(),
          schoolId: uuidSchema.label("schoolId").optional(),
          departmentId: optionalUuidSchema.label("departmentId").optional(),
          scope: scopeSchema.optional(),
          link: Joi.string().uri().max(500).optional().allow("").messages({
            "string.uri": "Link must be a valid URL",
            "string.max": "Link cannot exceed 500 characters",
          }),
        }),
      },
    },
  },
  {
    method: "DELETE",
    path: "/events/{eventId}",
    handler: deleteEvent,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          eventId: uuidSchema,
        }),
      },
    },
  },
];

export default eventRoutes;
