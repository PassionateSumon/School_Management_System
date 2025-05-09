import type { ServerRoute } from "@hapi/hapi";
import {
  createResult,
  deleteResult,
  getAllResults,
  getSingleResult,
  updateResult,
} from "controllers/result.controller";
import Joi from "joi";
import { JWTUtil } from "utils/jwtAll.util";

const resultRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/results",
    handler: createResult,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("teacher")],
      validate: {
        payload: Joi.object({
          studentId: Joi.string().required(),
          schoolId: Joi.string().required(),
          className: Joi.string().required(),
          subjectName: Joi.string().required(),
          assignmentId: Joi.string().optional(),
          examScheduleId: Joi.string().optional(),
          file: Joi.string().min(1).max(500).required(),
          grade: Joi.string().required(),
          maxPoints: Joi.number().min(0).optional(),
          obtainedPoints: Joi.number().min(0).optional(),
        }).or("assignmentId", "examScheduleId"),
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
    path: "/results",
    handler: getAllResults,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("teacher")],
      validate: {
        query: Joi.object({
          classId: Joi.string().required(),
          subjectId: Joi.string().optional(),
          assignmentId: Joi.string().optional(),
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
    path: "/results/{id}",
    handler: getSingleResult,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("teacher")],
      validate: {
        params: Joi.object({
          id: Joi.string().required(),
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
    path: "/results/{id}",
    handler: updateResult,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("teacher")],
      validate: {
        params: Joi.object({
          id: Joi.string().required(),
        }),
        payload: Joi.object({
          studentId: Joi.string().optional(),
          schoolId: Joi.string().optional(),
          className: Joi.string().optional(),
          subjectName: Joi.string().optional(),
          assignmentId: Joi.string().optional(),
          examScheduleId: Joi.string().optional(),
          file: Joi.string().min(1).max(500).optional(),
          grade: Joi.string().optional(),
          maxPoints: Joi.number().min(0).optional(),
          obtainedPoints: Joi.number().min(0).optional(),
        }).or("assignmentId", "examScheduleId"),
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
    method: "DELETE",
    path: "/results/{id}",
    handler: deleteResult,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("teacher")],
      validate: {
        params: Joi.object({
          id: Joi.string().required(),
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

export default resultRoutes;
