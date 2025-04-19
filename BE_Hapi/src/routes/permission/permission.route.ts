import type { ServerRoute } from "@hapi/hapi";
import {
  getSingleRolePermissions,
  getSingleUserPermissions,
  givePermission,
  updateSingleRolePermissions,
  updateSingleUserPermissions,
} from "../../controllers/permission.controller";
import Joi from "joi";
import { statusCodes } from "../../config/constants";

// Extend PluginSpecificConfiguration to include restrictToPermissionPlugin
declare module "@hapi/hapi" {
  interface PluginSpecificConfiguration {
    restrictToPermissionPlugin?: {
      moduleName: string;
      action: string;
    };
  }
}

const permissionRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/give-permission",
    handler: givePermission,
    options: {
      plugins: {
        restrictToPermissionPlugin: {
          moduleName: "permission",
          action: "create",
        },
      },
      validate: {
        payload: Joi.object({
          userId: Joi.string().uuid().when("scope", {
            is: "specific",
            then: Joi.required(),
            otherwise: Joi.forbidden(),
          }),
          roleId: Joi.string().uuid().when("scope", {
            is: "all",
            then: Joi.required(),
            otherwise: Joi.forbidden(),
          }),
          moduleName: Joi.string().required(),
          action: Joi.string()
            .valid("read", "write", "delete", "manage-all")
            .required(),
          targetType: Joi.string().valid("school", "class", "event").required(),
          targetId: Joi.string().uuid().required(),
          scope: Joi.string().valid("specific", "all").required(),
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
      tags: ["api", "permission"],
      description: "Giving permission(s) to either user or role.",
      auth: "jwt_access",
      payload: {
        parse: true,
        output: "data",
      },
    },
  },
  {
    method: "GET",
    path: "/user-permissions",
    handler: getSingleUserPermissions,
    options: {
      plugins: {
        restrictToPermissionPlugin: {
          moduleName: "permission",
          action: "read",
        },
      },
      tags: ["api", "permission"],
      description: "Retrieve permissions for a specific user.",
      auth: "jwt_access",
    },
  },
  {
    method: "GET",
    path: "/role-permissions",
    handler: getSingleRolePermissions,
    options: {
      plugins: {
        restrictToPermissionPlugin: {
          moduleName: "permission",
          action: "read",
        },
      },
      tags: ["api", "permission"],
      description: "Retrieve permissions for a specific role.",
      auth: "jwt_access",
    },
  },
  {
    method: "PUT",
    path: "/update-single-user-permissions",
    handler: updateSingleUserPermissions,
    options: {
      plugins: {
        restrictToPermissionPlugin: {
          moduleName: "permission",
          action: "write",
        },
      },
      validate: {
        payload: Joi.object({
          userId: Joi.string().uuid().required(),
          targetType: Joi.string().valid("school", "class", "event", "notice").optional(),
          targetId: Joi.string().uuid().when("targetType", {
            is: Joi.exist(),
            then: Joi.required(),
            otherwise: Joi.forbidden(),
          }),
          permissions: Joi.array()
            .items(
              Joi.object({
                moduleName: Joi.string().required(),
                actions: Joi.array()
                  .items(Joi.string().trim().min(1))
                  .min(1)
                  .required(),
              })
            )
            .min(1)
            .required(),
        }),
        query: Joi.object({
          limit: Joi.number().integer().min(1).optional(),
          offset: Joi.number().integer().min(0).optional(),
        }),
        failAction: (request, h, err: any) => {
          const errorMessage = err?.details?.[0]?.message || "Invalid request payload or query";
          return h.response({ status: "Failed", error: errorMessage }).code(statusCodes.BAD_REQUEST).takeover();
        },
      },
      tags: ["api", "permission"],
      description: "Update permissions for a specific user based on module and dynamic actions, with pagination support",
      auth: "jwt_access",
      payload: { parse: true, output: "data" },
    },
  },
  // {
  //   method: "PUT",
  //   path: "/update-single-role-permissions",
  //   handler: updateSingleRolePermissions,
  //   options: {
  //     plugins: {
  //       restrictToPermissionPlugin: {
  //         moduleName: "permission",
  //         action: "write",
  //       },
  //     },
  //     validate: {
  //       payload: Joi.object({
  //         roleId: Joi.string().uuid().required(),
  //         targetType: Joi.string().valid("school", "class", "event", "notice").optional(),
  //         targetId: Joi.string().uuid().when("targetType", {
  //           is: Joi.exist(),
  //           then: Joi.required(),
  //           otherwise: Joi.forbidden(),
  //         }),
  //         permissions: Joi.array()
  //           .items(
  //             Joi.object({
  //               moduleName: Joi.string().required(),
  //               actions: Joi.array()
  //                 .items(Joi.string().trim().min(1))
  //                 .min(1)
  //                 .required(),
  //             })
  //           )
  //           .min(1)
  //           .required(),
  //       }),
  //       query: Joi.object({
  //         limit: Joi.number().integer().min(1).optional(),
  //         offset: Joi.number().integer().min(0).optional(),
  //       }),
  //       failAction: (request, h, err: any) => {
  //         const errorMessage = err?.details?.[0]?.message || "Invalid request payload or query";
  //         return h.response({ status: "Failed", error: errorMessage }).code(400).takeover();
  //       },
  //     },
  //     tags: ["api", "permission", "role"],
  //     description: "Update permissions for a specific role based on module and dynamic actions, with pagination support",
  //     auth: "jwt",
  //     payload: { parse: true, output: "data" },
  //   },
  // },
];

export default permissionRoutes;
