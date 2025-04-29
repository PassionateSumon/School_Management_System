import type { ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import {
  createSchool,
  deleteSchool,
  getSchool,
  listSchools,
  updateSchool,
} from "../controllers/school.controller";

const schoolRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/schools",
    handler: createSchool,
    options: {
      auth: "jwt_access",
      description: "Create a new school",
      tags: ["api", "schools"],
      validate: {
        payload: Joi.object({
          name: Joi.string().min(3).max(100).required(),
          address: Joi.string().max(255).optional().allow(""),
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
    path: "/schools",
    handler: listSchools,
    options: {
      auth: "jwt_access",
      description: "List all schools",
      tags: ["api", "schools"],
    },
  },
  {
    method: "GET",
    path: "/schools/{schoolId}",
    handler: getSchool,
    options: {
      auth: "jwt_access",
      description: "Get details of a specific school",
      tags: ["api", "schools"],
      validate: {
        params: Joi.object({
          schoolId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "PATCH",
    path: "/schools/{schoolId}",
    handler: updateSchool,
    options: {
      auth: "jwt_access",
      description: "Update a school",
      tags: ["api", "schools"],
      validate: {
        params: Joi.object({
          schoolId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          name: Joi.string().min(3).max(100).optional(),
          address: Joi.string().max(255).optional().allow(""),
        }).min(1),
      },
    },
  },
  {
    method: "DELETE",
    path: "/schools/{schoolId}",
    handler: deleteSchool,
    options: {
      auth: "jwt_access",
      description: "Delete a school",
      tags: ["api", "schools"],
      validate: {
        params: Joi.object({
          schoolId: Joi.string().uuid().required(),
        }),
      },
    },
  },
];

export default schoolRoutes;
