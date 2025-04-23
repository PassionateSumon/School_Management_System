import type { ServerRoute } from "@hapi/hapi";
import {
  createRole,
  deleteAllRoles,
  deleteSingleRole,
  getAllRoles,
  getSingleRole,
  updateRole,
} from "../controllers/role.controller";
import Joi from "joi";

const roleRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/roles",
    handler: createRole,
    options: {
      auth: "jwt_access",
      description: "Create a new role",
      tags: ["api", "roles"],
      validate: {
        payload: Joi.object({
          title: Joi.string().min(2).max(100).required(),
          schoolId: Joi.string().uuid().required(),
          priority: Joi.number().integer().min(0).required(),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/roles",
    handler: getAllRoles,
    options: {
      auth: "jwt_access",
      description: "List all roles in the school",
      tags: ["api", "roles"],
    },
  },
  {
    method: "GET",
    path: "/roles/{roleId}",
    handler: getSingleRole,
    options: {
      auth: "jwt_access",
      description: "Get details of a specific role",
      tags: ["api", "roles"],
      validate: {
        params: Joi.object({
          roleId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "PATCH",
    path: "/roles/{roleId}",
    handler: updateRole,
    options: {
      auth: "jwt_access",
      description: "Update a role",
      tags: ["api", "roles"],
      validate: {
        params: Joi.object({
          roleId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          title: Joi.string().min(2).max(100).optional(),
          priority: Joi.number().integer().min(0).optional(),
        }).min(1),
      },
    },
  },
  {
    method: "DELETE",
    path: "/roles/{roleId}",
    handler: deleteSingleRole,
    options: {
      auth: "jwt_access",
      description: "Delete a role",
      tags: ["api", "roles"],
      validate: {
        params: Joi.object({
          roleId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "DELETE",
    path: "/roles",
    handler: deleteAllRoles,
    options: {
      auth: "jwt_access",
      description: "Delete all non-super_admin roles in the school",
      tags: ["api", "roles"],
    },
  },
];

export default roleRoutes;
