import type { Request, ResponseToolkit, Server } from "@hapi/hapi";
import type { PermissionOptions } from "../interfaces/PermissionOpions";
import { JWTUtil } from "../utils/jwtAll.util";
import { error } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { User } from "../models/User.model";
import { Module } from "../models/Module.model";
import { Permission } from "../models/Permission.model";
import { Op } from "sequelize";

export const restrictToPermissionPlugin = {
  name: "restrictToPermissionPlugin",
  version: "1.0.0",
  register: async (server: Server) => {
    server.ext("onPreHandler", async (request: Request, h: ResponseToolkit) => {
      const options = (request.route.settings.plugins as any)
        ?.restrictToPermission as PermissionOptions | undefined;
      if (!options || !options.moduleName || !options.action) {
        return h.continue; // Skip if no permission check required
      }
      const { moduleName, action } = options;
      try {
        const accessToken = request.state.accessToken;
        const decoded = JWTUtil.verifyAccessToken(accessToken);
        if (!decoded) {
          return error(
            null,
            "Invalid access token!",
            statusCodes.UNAUTHORIZED
          )(h);
        }

        const user: any = await User.findByPk(decoded.id);
        if (!user) {
          return error(
            null,
            "User not found or inactive!",
            statusCodes.NOT_FOUND
          );
        }

        if (user.system_defined && user.isActive) {
          return h.continue;
        }

        const module: any = await Module.findOne({
          where: { name: moduleName },
        });
        if (!module) {
          return error(null, "Can't find module", statusCodes.NOT_FOUND)(h);
        }

        const source =
          request.method === "get" ? request.query : request.payload;
        const targetType = (source as any)?.targetType || "school";
        const targetId = (source as any)?.targetId || user.schoolId;

        const permission = await Permission.findOne({
          where: {
            moduleId: module.id,
            action,
            targetType,
            targetId,
            [Op.or]: [
              { userId: user.id, scope: "specific" },
              { roleId: user.roleId, scope: "all" },
            ],
          },
        });
        if (permission) {
          return h.continue;
        }

        return error(
          null,
          "Insufficient permissions!",
          statusCodes.BAD_REQUEST
        );
      } catch (err: any) {
        console.error("Permission Plugin Error:", err);
        return error(
          null,
          err.message || "Internal server error at Permission plugin!",
          statusCodes.SERVER_ISSUE
        )(h);
      }
    });
  },
};
