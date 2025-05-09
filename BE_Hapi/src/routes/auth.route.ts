import type { ServerRoute } from "@hapi/hapi";
import {
  loginController,
  logoutController,
  refreshController,
  resetPassword,
  signupController,
  verifyTokenController,
} from "../controllers/auth.controller";
import Joi from "joi";

const prefix = "/auth";

const authRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/signup",
    handler: signupController,
    options: {
      validate: {
        // payload: Joi.object({
        //   email: Joi.string().email().required().messages({
        //     "any.required": "email is required!",
        //   }),
        //   password: Joi.string().required().messages({
        //     "any.required": "password is required!",
        //   }),
        // }),
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
      tags: ["api", "auth"],
      description: "Signup the Super Admin or Invited User.",
      auth: false,
      payload: {
        parse: true,
        output: "data",
      },
    },
  },
  {
    method: "POST",
    path: "/login",
    handler: loginController,
    options: {
      validate: {
        payload: Joi.object({
          usernameOrEmail: Joi.string().min(3).max(100).required(),
          password: Joi.string().min(6).max(100).optional(),
          tempPassword: Joi.string().min(6).max(100).optional(),
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
      tags: ["api", "auth"],
      description: "Signup the Super Admin or Invited User.",
      auth: false,
      payload: {
        parse: true,
        output: "data",
      },
    },
  },
  {
    method: "POST",
    path: "/logout",
    handler: logoutController,
    options: {
      tags: ["api", "auth"],
      description: "Logout the user.",
      auth: "jwt_access",
    },
  },
  {
    method: "PUT",
    path: "/reset-password",
    handler: resetPassword,
    options: {
      tags: ["api", "auth"],
      description: "Logout the user.",
      auth: "jwt_access",
      payload: {
        parse: true,
        output: "data",
      },
    },
  },
  {
    method: "POST",
    path: "/refresh",
    handler: refreshController,
    options: {
      tags: ["api", "auth"],
      description: "Refresh the token of the user.",
      auth: "jwt_access",
    },
  },
  {
    method: "GET",
    path: "/verify-token",
    handler: verifyTokenController,
    options: {
      tags: ["api", "auth"],
      description: "Verify token of the user.",
      auth: "jwt_access",
    },
  },
];

export default authRoutes;
