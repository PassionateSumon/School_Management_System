import type { ServerRoute } from "@hapi/hapi";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentDetails,
  getAssignments,
  getStudentSubmission,
  getSubmissions,
  manageSubmissionEdit,
  submitAssignment,
  updateAssignment,
} from "../controllers/assignment.controller";
import Joi from "joi";
import { JWTUtil } from "../utils/jwtAll.util";

const assignmentRoutes: ServerRoute[] = [
  {
    method: "POST",
    path: "/assignments",
    handler: createAssignment,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        payload: Joi.object({
          title: Joi.string().required(),
          description: Joi.string().allow("").optional(),
          dueDate: Joi.date().iso().required(),
          file: Joi.any().optional(),
          classId: Joi.string().uuid().optional(),
          subjectId: Joi.string().uuid().required(),
          schoolId: Joi.string().uuid().required(),
          status: Joi.string().valid("draft", "published").default("draft"),
          maxPoints: Joi.number().integer().min(1).default(100),
        }),
      },
      payload: {
        parse: true,
        allow: "multipart/form-data",
        maxBytes: 10485760, // 10 MB
        output: "stream",
      },
    },
  },
  {
    method: "GET",
    path: "/assignments",
    handler: getAssignments,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
    },
  },
  {
    method: "GET",
    path: "/assignments/{assignmentId}",
    handler: getAssignmentDetails,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          assignmentId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "PUT",
    path: "/assignments/{assignmentId}",
    handler: updateAssignment,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          assignmentId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          title: Joi.string().optional(),
          description: Joi.string().allow("").optional(),
          dueDate: Joi.date().iso().optional(),
          file: Joi.any().optional(),
          classId: Joi.string().uuid().allow(null).optional(),
          subjectId: Joi.string().uuid().optional(),
          schoolId: Joi.string().uuid().optional(),
          status: Joi.string().valid("draft", "published").optional(),
          maxPoints: Joi.number().integer().min(1).optional(),
        }),
      },
      payload: {
        parse: true,
        allow: "multipart/form-data",
        maxBytes: 10485760, // 10 MB
        output: "stream",
      },
    },
  },
  {
    method: "DELETE",
    path: "/assignments/{assignmentId}",
    handler: deleteAssignment,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          assignmentId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "POST",
    path: "/assignments/{assignmentId}/submit",
    handler: submitAssignment,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          assignmentId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          submissionFileUrl: Joi.string().uri().optional(),
          submissionText: Joi.string().allow("").optional(),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/assignments/{assignmentId}/submissions",
    handler: getSubmissions,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          assignmentId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "GET",
    path: "/assignments/{assignmentId}/submission",
    handler: getStudentSubmission,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          assignmentId: Joi.string().uuid().required(),
        }),
      },
    },
  },
  {
    method: "PUT",
    path: "/assignments/{assignmentId}/submissions/{studentId}",
    handler: manageSubmissionEdit,
    options: {
      auth: "jwt_access",
      pre: [JWTUtil.verifyRole("super_admin")],
      validate: {
        params: Joi.object({
          assignmentId: Joi.string().uuid().required(),
          studentId: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          editRequested: Joi.boolean().optional(),
          editApproved: Joi.boolean().optional(),
        }),
      },
    },
  },
];

export default assignmentRoutes;
