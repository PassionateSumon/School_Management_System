import type { ServerRoute } from "@hapi/hapi";
import {
  createExam,
  deleteExam,
  getAllExams,
  getSingleExam,
  updateExam,
} from "../controllers/examSchedule.controller";
import Joi from "joi";
import {
  optionalUuidSchema,
  typeSchema,
  uuidSchema,
} from "./schemas/allSchemas";
import { JWTUtil } from "../utils/jwtAll.util";

const examRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/exams",
    handler: createExam,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        payload: Joi.object({
          classId: uuidSchema.label("classId"),
          schoolId: uuidSchema.label("schoolId").optional(),
          invigilatorId: optionalUuidSchema.label("invigilatorId"),
          subjectId: uuidSchema.label("subjectId"),
          date: Joi.date().iso().required().messages({
            "date.format": "Date must be in ISO format",
          }),
          type: typeSchema,
          startTime: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required()
            .messages({
              "string.pattern.base":
                "Start time must be in HH:MM format (24-hour)",
            }),
          endTime: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required()
            .messages({
              "string.pattern.base":
                "End time must be in HH:MM format (24-hour)",
            }),
          roomNo: Joi.string().min(1).max(50).required().messages({
            "string.min": "Room number must be at least 1 character",
            "string.max": "Room number cannot exceed 50 characters",
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
      },
    },
  },
  {
    method: "GET",
    path: "/exams",
    handler: getAllExams,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        query: Joi.object({
          className: Joi.string().max(255).optional().messages({
            "string.max": "Class name cannot exceed 255 characters",
          }),
          schoolId: optionalUuidSchema.label("schoolId"),
          type: typeSchema.optional(),
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
    },
  },
  {
    method: "GET",
    path: "/exams/{examId}",
    handler: getSingleExam,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          examId: uuidSchema,
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
    },
  },
  {
    method: "PUT",
    path: "/exams/{examId}",
    handler: updateExam,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          examId: uuidSchema,
        }),
        payload: Joi.object({
          classId: uuidSchema.label("classId").optional(),
          schoolId: uuidSchema.label("schoolId").optional(),
          invigilatorId: optionalUuidSchema.label("invigilatorId").optional(),
          subjectId: uuidSchema.label("subjectId").optional(),
          date: Joi.date().iso().optional().messages({
            "date.format": "Date must be in ISO format",
          }),
          type: typeSchema.optional(),
          startTime: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .optional()
            .messages({
              "string.pattern.base":
                "Start time must be in HH:MM format (24-hour)",
            }),
          endTime: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .optional()
            .messages({
              "string.pattern.base":
                "End time must be in HH:MM format (24-hour)",
            }),
          roomNo: Joi.string().min(1).max(50).optional().messages({
            "string.min": "Room number must be at least 1 character",
            "string.max": "Room number cannot exceed 50 characters",
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
      },
    },
  },
  {
    method: "DELETE",
    path: "/exams/{examId}",
    handler: deleteExam,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          examId: uuidSchema,
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
    },
  },
];

export default examRoutes;
