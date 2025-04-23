import type { ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getSingleDepartment,
  updateDepartment,
} from "../controllers/department.controller";

const departmentRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/departments",
    handler: createDepartment,
    options: {
      auth: "jwt_access",
      description: "Create a new department",
      tags: ["api", "departments"],
      validate: {
        payload: Joi.object({
          name: Joi.string().min(2).max(100).required(),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/departments",
    handler: getAllDepartments,
    options: {
      auth: "jwt_access",
      description: "List all departments in the school",
      tags: ["api", "departments"],
    },
  },
  {
    method: "GET",
    path: "/departments/{departmentId}",
    handler: getSingleDepartment,
    options: {
      auth: "jwt_access",
      description: "Get details of a specific department",
      tags: ["api", "departments"],
      validate: {
        params: Joi.object({
          departmentId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "PATCH",
    path: "/departments/{departmentId}",
    handler: updateDepartment,
    options: {
      auth: "jwt_access",
      description: "Update a department",
      tags: ["api", "departments"],
      validate: {
        params: Joi.object({
          departmentId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          name: Joi.string().min(2).max(100).optional(),
        }).min(1),
      },
    },
  },
  {
    method: "DELETE",
    path: "/departments/{departmentId}",
    handler: deleteDepartment,
    options: {
      auth: "jwt_access",
      description: "Delete a department",
      tags: ["api", "departments"],
      validate: {
        params: Joi.object({
          departmentId: Joi.string().uuid().required(),
        }),
      },
    },
  },
];

export default departmentRoutes;
