import type { ServerRoute } from "@hapi/hapi";
import {
  bulkCreateInvites,
  cancelInvite,
  createAndSendInvite,
  getInviteDetails,
  listInvites,
  listUserInvites,
  resendInvite,
  updateInvite,
} from "../controllers/invite.controller";
import Joi from "joi";

const inviteRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/invites/create-and-send",
    handler: createAndSendInvite,
    options: {
      auth: "jwt_access",
      description: "Create and send an invite",
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required(),
          role: Joi.string().required(),
          firstName: Joi.string().required(),
          className: Joi.string().uuid().optional(),
          lastName: Joi.string().optional(),
          priority: Joi.number().integer().min(1).optional(),
        }),
      },
      payload: {
        parse: true,
        output: "data",
      },
    },
  },
  {
    method: "POST",
    path: "/invites/resend/{inviteId}",
    handler: resendInvite,
    options: {
      auth: "jwt_access",
      description: "Resend a pending invite",
      validate: {
        params: Joi.object({
          inviteId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/invites",
    handler: listInvites,
    options: {
      auth: "jwt_access",
      description: "List all invites for a school",
      tags: ["api", "invites"],
      validate: {
        query: Joi.object({
          status: Joi.string()
            .valid("pending", "accepted", "rejected", "expired")
            .optional(),
          role: Joi.string().optional(),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/invites/{inviteId}",
    handler: getInviteDetails,
    options: {
      auth: "jwt_access",
      description: "Get details of a specific invite",
      tags: ["api", "invites"],
      validate: {
        params: Joi.object({
          inviteId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "DELETE",
    path: "/invites/{inviteId}",
    handler: cancelInvite,
    options: {
      auth: "jwt_access",
      description: "Cancel a pending invite",
      tags: ["api", "invites"],
      validate: {
        params: Joi.object({
          inviteId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "PATCH",
    path: "/invites/{inviteId}",
    handler: updateInvite,
    options: {
      auth: "jwt_access",
      description: "Update a pending invite",
      tags: ["api", "invites"],
      validate: {
        params: Joi.object({
          inviteId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          role: Joi.string().optional(),
          classId: Joi.string().uuid().optional(),
          priority: Joi.number().integer().min(1).max(1000).optional(),
        }).min(1),
      },
    },
  },
  {
    method: "POST",
    path: "/invites/bulk-create",
    handler: bulkCreateInvites,
    options: {
      auth: "jwt_access",
      description: "Create and send multiple invites",
      tags: ["api", "invites"],
      validate: {
        payload: Joi.array()
          .items(
            Joi.object({
              email: Joi.string().email().required(),
              role: Joi.string().required(),
              classId: Joi.string().uuid().optional(),
              firstName: Joi.string().required(),
              lastName: Joi.string().optional(),
              priority: Joi.number().integer().min(1).max(1000).optional(),
            })
          )
          .min(1),
      },
    },
  },
  {
    method: "GET",
    path: "/invites/user",
    handler: listUserInvites,
    options: {
      auth: "jwt_access",
      description: "List invites for the authenticated user",
      tags: ["api", "invites"],
      validate: {
        query: Joi.object({
          status: Joi.string()
            .valid("pending", "accepted", "rejected", "expired")
            .optional(),
        }),
      },
    },
  },
];

export default inviteRoutes;
