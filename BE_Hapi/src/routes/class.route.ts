import type { ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import {
  createClass,
  deleteClass,
  getClass,
  listClasses,
  updateClass,
  VALID_DEPARTMENTS,
} from "../controllers/class.controller";
import { JWTUtil } from "../utils/jwtAll.util";

const classRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/classes",
    handler: createClass,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      description: "Create a new class",
      tags: ["api", "classes"],
      validate: {
        payload: Joi.object({
          name: Joi.string().min(3).max(100).required(),
          department: Joi.string()
            .valid(...VALID_DEPARTMENTS.filter((d) => d))
            .optional()
            .allow(null),
        }),
      },
      payload: {
        parse: true,
        output: "data",
      },
    },
  },
  {
    method: "GET",
    path: "/classes",
    handler: listClasses,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      description: "List all classes in the school",
      tags: ["api", "classes"],
    },
  },
  {
    method: "GET",
    path: "/classes/{classId}",
    handler: getClass,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      description: "Get details of a specific class",
      tags: ["api", "classes"],
      validate: {
        params: Joi.object({
          classId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "PATCH",
    path: "/classes/{classId}",
    handler: updateClass,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      description: "Update a class",
      tags: ["api", "classes"],
      validate: {
        params: Joi.object({
          classId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          name: Joi.string().min(3).max(100).optional(),
          department: Joi.string()
            .valid(...VALID_DEPARTMENTS.filter((d) => d))
            .optional()
            .allow(null),
        }).min(1),
      },
      payload: {
        parse: true,
        output: "data",
      },
    },
  },
  {
    method: "DELETE",
    path: "/classes/{classId}",
    handler: deleteClass,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      description: "Delete a class",
      tags: ["api", "classes"],
      validate: {
        params: Joi.object({
          classId: Joi.string().uuid().required(),
        }),
      },
    },
  },
];

export default classRoutes;
