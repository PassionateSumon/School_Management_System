import Joi from "joi";

export const uuidSchema = Joi.string()
  .guid({ version: ["uuidv4"] })
  .required()
  .messages({
    "string.guid": "{{#label}} must be a valid UUID",
  });

export const optionalUuidSchema = Joi.string()
  .guid({ version: ["uuidv4"] })
  .optional()
  .allow(null)
  .messages({
    "string.guid": "{{#label}} must be a valid UUID",
  });

export const fileSchema = Joi.any()
  .meta({ swaggerType: "file" })
  .optional()
  .description("File to upload (e.g., PDF, image)");

export const statusSchema = Joi.string()
  .valid("Draft", "Published", "Completed")
  .optional()
  .default("Draft")
  .messages({
    "any.only":
      '{{#label}} must be one of "Draft", "Published", or "Completed"',
  });

export const scopeSchema = Joi.string()
  .valid("school", "class", "department")
  .optional()
  .default("school")
  .messages({
    "any.only": '{{#label}} must be one of "school", "class", or "department"',
  });
