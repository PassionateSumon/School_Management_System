import type { ServerRoute } from "@hapi/hapi";
import { deleteAllClassSchedules, deleteSingleClassSchedule, getAllClassSchedules, getSingleClassSchedule, getSpecificClassSchedules, updateSingleClassSchedule } from "../controllers/classSchedule.controller";
import Joi from "joi";

const classScheduleRoutes: ServerRoute[] =[
    {
        method: "GET",
        path: "/class-schedules",
        handler: getAllClassSchedules,
        options: {
          auth: "jwt_access",
          description: "List all class schedules in the school",
          tags: ["api", "class-schedules"],
          validate: {
            query: Joi.object({
              fromDate: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
              toDate: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
                .when('fromDate', {
                  is: Joi.exist(),
                  then: Joi.string().custom((value, helpers) => {
                    if (new Date(value) < new Date(helpers.state.ancestors[0].fromDate)) {
                      return helpers.error('any.invalid', { message: 'toDate must be after fromDate' });
                    }
                    return value;
                  }, 'toDate validation'),
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
          description: "List class schedules for a specific class",
          tags: ["api", "class-schedules"],
          validate: {
            params: Joi.object({
              classId: Joi.string().uuid().required(),
            }),
            query: Joi.object({
              fromDate: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
              toDate: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
                .when('fromDate', {
                  is: Joi.exist(),
                  then: Joi.string().custom((value, helpers) => {
                    if (new Date(value) < new Date(helpers.state.ancestors[0].fromDate)) {
                      return helpers.error('any.invalid', { message: 'toDate must be after fromDate' });
                    }
                    return value;
                  }, 'toDate validation'),
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
              date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
              startTime: Joi.string().optional(),
              endTime: Joi.string().optional(),
            }).min(1),
          },
        },
      },
      {
        method: "DELETE",
        path: "/classes/{classId}/class-schedules/{classScheduleId}",
        handler: deleteSingleClassSchedule,
        options: {
          auth: "jwt_access",
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
          description: "Delete all class schedules in the school",
          tags: ["api", "class-schedules"],
        },
      },
]

export default classScheduleRoutes;