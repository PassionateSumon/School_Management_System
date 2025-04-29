import type { ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import {
  createComplaint,
  deleteSingleComplaint,
  getAllComplaints,
  updateComplaint,
} from "../controllers/complaint.controller";

const complaintRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/complaints",
    handler: createComplaint,
    options: {
      auth: "jwt_access",
      description: "Create a new complaint for the current user",
      tags: ["api", "complaints"],
      validate: {
        payload: Joi.object({
          subject: Joi.string().min(2).max(100).required(),
          description: Joi.string().max(1000).optional().allow(null),
          className: Joi.string().max(100).optional().allow(null),
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
    path: "/complaints",
    handler: getAllComplaints,
    options: {
      auth: "jwt_access",
      description: "List complaints (own, by class, or school-wide)",
      tags: ["api", "complaints"],
      validate: {
        query: Joi.object({
          className: Joi.string().max(100).optional(),
          own: Joi.boolean().optional(),
        }),
      },
    },
  },
  {
    method: "PATCH",
    path: "/complaints/{complaintId}",
    handler: updateComplaint,
    options: {
      auth: "jwt_access",
      description: "Update a complaint",
      tags: ["api", "complaints"],
      validate: {
        params: Joi.object({
          complaintId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          subject: Joi.string().min(2).max(100).optional(),
          description: Joi.string().max(1000).optional().allow(null),
          className: Joi.string().max(100).optional().allow(null),
          status: Joi.string()
            .valid("pending", "attened", "resolved")
            .optional(),
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
    path: "/complaints/{complaintId}",
    handler: deleteSingleComplaint,
    options: {
      auth: "jwt_access",
      description: "Delete a complaint",
      tags: ["api", "complaints"],
      validate: {
        params: Joi.object({
          complaintId: Joi.string().uuid().required(),
        }),
      },
      payload: {
        parse: true,
        output: "data",
      },
    },
  },
];

export default complaintRoutes;
