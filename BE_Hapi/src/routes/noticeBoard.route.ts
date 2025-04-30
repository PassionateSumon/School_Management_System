import type { ServerRoute } from "@hapi/hapi";
import Joi from "joi";
import {
  createNotice,
  deleteNotice,
  getNoticeDetails,
  listNotices,
  updateNotice,
} from "../controllers/noticeBoard.controller";
import {
  fileSchema,
  optionalUuidSchema,
  statusSchema,
  uuidSchema,
} from "./schemas/allSchemas";
import { JWTUtil } from "../utils/jwtAll.util";

const noticeBoardRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/notices",
    handler: createNotice,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      payload: { parse: true, multipart: true, maxBytes: 10 * 1024 * 1024 }, // 10MB limit
      validate: {
        payload: Joi.object({
          notice: Joi.string().min(1).required().messages({
            "string.min": "Notice content must be at least 1 character",
          }),
          schoolId: uuidSchema.label("schoolId"),
          classId: optionalUuidSchema.label("classId"),
          departmentId: optionalUuidSchema.label("departmentId"),
          status: statusSchema,
          file: fileSchema,
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/notices",
    handler: listNotices,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        query: Joi.object({
          schoolId: uuidSchema.label("schoolId"),
          classId: optionalUuidSchema.label("classId"),
          departmentId: optionalUuidSchema.label("departmentId"),
          status: statusSchema.optional(),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/notices/{noticeId}",
    handler: getNoticeDetails,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          noticeId: uuidSchema,
        }),
      },
    },
  },
  {
    method: "PUT",
    path: "/notices/{noticeId}",
    handler: updateNotice,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      payload: { parse: true, multipart: true, maxBytes: 10 * 1024 * 1024 }, // 10MB limit
      validate: {
        params: Joi.object({
          noticeId: uuidSchema,
        }),
        payload: Joi.object({
          notice: Joi.string().min(1).optional().messages({
            "string.min": "Notice content must be at least 1 character",
          }),
          schoolId: uuidSchema.label("schoolId").optional(),
          classId: optionalUuidSchema.label("classId").optional(),
          departmentId: optionalUuidSchema.label("departmentId").optional(),
          status: statusSchema.optional(),
          file: fileSchema,
        }),
      },
    },
  },
  {
    method: "DELETE",
    path: "/notices/{noticeId}",
    handler: deleteNotice,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          noticeId: uuidSchema,
        }),
      },
    },
  },
];

export default noticeBoardRoutes;
