import type { ServerRoute } from "@hapi/hapi";
import {
  createClassSchedule,
  deleteAllClassSchedules,
  deleteSingleClassSchedule,
  getAllClassSchedules,
  getSingleClassSchedule,
  getSpecificClassSchedules,
  updateSingleClassSchedule,
} from "../controllers/classSchedule.controller";
import Joi from "joi";
import { JWTUtil } from "utils/jwtAll.util";

const classScheduleRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/class-schedule",
    handler: createClassSchedule,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      description: "Create a new class schedule",
      tags: ["api", "class-schedule"],
      validate: {
        payload: Joi.object({
          teacherName: Joi.string()
            .required()
            .trim()
            .min(3)
            .max(100)
            .pattern(/^[A-Za-z\s]+$/)
            .description('Full name of the teacher (e.g., "John Doe")'),
          subjectName: Joi.string()
            .required()
            .trim()
            .min(2)
            .max(50)
            .description('Name of the subject (e.g., "Mathematics")'),
          className: Joi.string()
            .required()
            .trim()
            .min(1)
            .max(50)
            .description(
              'Class name, optionally with department (e.g., "10A Science")'
            ),
          date: Joi.string()
            .required()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .description("Date of the class in YYYY-MM-DD format"),
          startTime: Joi.string()
            .required()
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .description("Start time in HH:MM format (24-hour)"),
          endTime: Joi.string()
            .required()
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
            .description("End time in HH:MM format (24-hour)")
            .custom((value, helpers) => {
              const { startTime } = helpers.state.ancestors[0];
              if (startTime && value <= startTime) {
                return helpers.error("any.invalid", {
                  message: "endTime must be later than startTime",
                });
              }
              return value;
            }, "endTime validation"),
        }).options({ allowUnknown: false }),
        failAction: (request, h, err: any) => {
          return h
            .response({
              statusCode: 400,
              error: "Bad Request",
              message: err.details[0].message,
            })
            .code(400)
            .takeover();
        },
      },
      payload: {
        output: "data",
        parse: true,
      },
    },
  },
  {
    method: "GET",
    path: "/class-schedules",
    handler: getAllClassSchedules,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      description: "List all class schedules in the school",
      tags: ["api", "class-schedules"],
      validate: {
        query: Joi.object({
          fromDate: Joi.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          toDate: Joi.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .when("fromDate", {
              is: Joi.exist(),
              then: Joi.string().custom((value, helpers) => {
                if (
                  new Date(value) <
                  new Date(helpers.state.ancestors[0].fromDate)
                ) {
                  return helpers.error("any.invalid", {
                    message: "toDate must be after fromDate",
                  });
                }
                return value;
              }, "toDate validation"),
            }),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/classes/{classId}/class-schedules",
    handler: getSpecificClassSchedules,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      description: "List class schedules for a specific class",
      tags: ["api", "class-schedules"],
      validate: {
        params: Joi.object({
          classId: Joi.string().uuid().required(),
        }),
        query: Joi.object({
          fromDate: Joi.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          toDate: Joi.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .when("fromDate", {
              is: Joi.exist(),
              then: Joi.string().custom((value, helpers) => {
                if (
                  new Date(value) <
                  new Date(helpers.state.ancestors[0].fromDate)
                ) {
                  return helpers.error("any.invalid", {
                    message: "toDate must be after fromDate",
                  });
                }
                return value;
              }, "toDate validation"),
            }),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/classes/{classId}/class-schedules/{classScheduleId}",
    handler: getSingleClassSchedule,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      description: "Get details of a specific class schedule",
      tags: ["api", "class-schedules"],
      validate: {
        params: Joi.object({
          classId: Joi.string().uuid().required(),
          classScheduleId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "PATCH",
    path: "/classes/{classId}/class-schedules/{classScheduleId}",
    handler: updateSingleClassSchedule,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      description: "Update a class schedule",
      tags: ["api", "class-schedules"],
      validate: {
        params: Joi.object({
          classId: Joi.string().uuid().required(),
          classScheduleId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          teacherName: Joi.string().min(3).max(100).optional(),
          subjectName: Joi.string().min(3).max(100).optional(),
          date: Joi.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          startTime: Joi.string().optional(),
          endTime: Joi.string().optional(),
        }).min(1),
      },
      payload: {
        output: "data",
        parse: true,
      },
    },
  },
  {
    method: "DELETE",
    path: "/classes/{classId}/class-schedules/{classScheduleId}",
    handler: deleteSingleClassSchedule,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      description: "Delete a class schedule",
      tags: ["api", "class-schedules"],
      validate: {
        params: Joi.object({
          classId: Joi.string().uuid().required(),
          classScheduleId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "DELETE",
    path: "/class-schedules",
    handler: deleteAllClassSchedules,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      description: "Delete all class schedules in the school",
      tags: ["api", "class-schedules"],
    },
  },
];

export default classScheduleRoutes;
