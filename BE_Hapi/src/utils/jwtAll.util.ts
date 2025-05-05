import type { Request, ResponseToolkit } from "@hapi/hapi";
import jwt from "jsonwebtoken";
import { db } from "db/db";
import dotenv from "dotenv";
dotenv.config();

const { role: Role } = db;
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "1d";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "30d";

export class JWTUtil {
  static generateAccessToken = (userId: string, roleId: string) => {
    if (!ACCESS_SECRET) throw new Error("Access secret key not found!");
    try {
      const token = (jwt as any).sign({ userId, roleId }, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES,
      });
      return token;
    } catch (error) {
      console.error("Error in jwt.sign:", error);
      throw error;
    }
  };

  static generateRefreshToken = (userId: string, roleId: string) => {
    if (!REFRESH_SECRET) throw new Error("Access secret key not found!");
    try {
      return (jwt as any).sign({ userId, roleId }, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES,
      });
    } catch (error) {
      console.error("Error in jwt.sign:", error);
      throw error;
    }
  };

  static verifyRefreshToken = (token: string) => {
    return (jwt as any).verify(token, REFRESH_SECRET) as { id: string };
  };
  static verifyAccessToken = (token: string) => {
    return (jwt as any).verify(token, ACCESS_SECRET) as { id: string };
  };

  static verifyRole = (requiredRole: any) => {
    return async (request: Request, h: ResponseToolkit) => {
      const { roleId } = request.auth.credentials as any;
      const roleName = (await Role.findOne({ where: { id: roleId } })) as any;
      if (!roleName) throw new Error("Role not found");
      // console.log("Role Name:", roleName.title);
      // console.log("Role:", role);
      if (roleName.title !== requiredRole) throw new Error("Forbidden");
      return h.continue;
    };
  };
}
