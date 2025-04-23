import type { ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import {
  bulkChangeStudentClass,
  changeStudentClass,
} from "../controllers/classStudent.controller";

const classStudentRoutes: ServerRoute[] = [
  {
    method: "PATCH",
    path: "/class-students/change-class",
    handler: changeStudentClass,
    options: {
      auth: "jwt_access",
      description: "Change a student's class",
      tags: ["api", "class-students"],
      validate: {
        payload: Joi.object({
          studentId: Joi.string().uuid().required(),
          className: Joi.string().min(3).max(100).required(),
        }),
      },
    },
  },
  {
    method: "PATCH",
    path: "/class-students/bulk-change-class",
    handler: bulkChangeStudentClass,
    options: {
      auth: "jwt_access",
      description: "Change multiple students' class",
      tags: ["api", "class-students"],
      validate: {
        payload: Joi.object({
          studentIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
          className: Joi.string().min(3).max(100).required(),
        }),
      },
    },
  },
];

export default classStudentRoutes;
