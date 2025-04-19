import type { ResponseToolkit } from "@hapi/hapi";
import { statusCodes } from "../config/constants";

export const success = (
  data: any,
  message = "Success",
  statusCode: any = statusCodes.SUCCESS
) => {
  return (res: ResponseToolkit) =>
    res
      .response({
        statusCode,
        message,
        data,
      })
      .code(statusCode);
};

export const error = (
  data: any,
  message = "Error",
  statusCode: any = statusCodes.SERVER_ISSUE
) => {
  return (res: ResponseToolkit) =>
    res
      .response({
        statusCode,
        message,
        data,
      })
      .code(statusCode);
};