import type { ServerRoute } from "@hapi/hapi";
import {
  loginController,
  logoutController,
  resetPassword,
  signupController,
} from "../../controllers/auth.controller";
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
        output: "data"
      }
    },
  },
];

export default authRoutes;
