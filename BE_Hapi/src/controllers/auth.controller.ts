import type { Request, ResponseToolkit } from "@hapi/hapi";
import { error, success } from "../utils/returnFunctions.util";
import { User } from "../models/User.model";
import { Role } from "../models/Role.model";
import { DataType } from "sequelize-typescript";
import { School } from "../models/School.model";
import { CryptoUtil } from "../utils/crypto.util";
import { JWTUtil } from "../utils/jwtAll.util";
import { Op } from "sequelize";
import type { LoginPayload } from "../interfaces/LoginPayload";
import { RefreshToken } from "../models/RefreshToken.model";
import { statusCodes } from "../config/constants";
import crypto from "crypto";
import type { ResetOrForgotPasswordPayload } from "../interfaces/ResetOrForgotPasswordPayload";

export const signupController = async (req: Request, h: ResponseToolkit) => {
  try {
    const { firstName, email, password, role, schoolId }: any = req.payload;
    if (!firstName || !email || !password) {
      return error(
        null,
        "First name, email, and password are required!",
        statusCodes.BAD_REQUEST
      )(h);
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return error(
        null,
        "Email already registered!",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Check if this is the first user (super_admin)
    const userCount = await User.count();
    let finalRoleId;
    let finalSchoolId = schoolId;

    if (userCount === 0) {
      // First user must be super_admin, ignore provided role/schoolId
      if (role || schoolId) {
        return error(
          null,
          "First user must be super_admin without role or schoolId!",
          statusCodes.BAD_REQUEST
        )(h);
      }

      // Create or get super_admin role
      const superAdminRole = await Role.findOrCreate({
        where: { title: "super_admin" },
        defaults: {
          title: "super_admin",
          schoolId: crypto.randomUUID(),
        },
      });
      finalRoleId = (superAdminRole as any)[0].id;
      finalSchoolId = null; // No school yet for super_admin
    } else {
      // Invited user: role and schoolId are required
      if (!role || !schoolId) {
        return error(
          null,
          "Role and School ID are required for invited users!",
          statusCodes.BAD_REQUEST
        )(h);
      }

      // Create or get role by name
      const userRole = await Role.findOrCreate({
        where: { title: role },
        defaults: {
          id: DataType.UUIDV4,
          title: role,
          schoolId,
        },
      });
      finalRoleId = (userRole as any)[0].id;

      // Verify school exists
      const school = await School.findByPk(schoolId);
      if (!school) {
        return error(null, "School not found!", statusCodes.NOT_FOUND)(h);
      }
    }

    const hashedPassword = CryptoUtil.hashPassword(password, "10");
    const user = await User.create({
      firstName,
      email,
      password: userCount === 0 ? hashedPassword : "",
      tempPassword: userCount === 0 ? "" : hashedPassword,
      roleId: finalRoleId,
      schoolId: finalSchoolId,
      isActive: true,
      isTempPassword: userCount !== 0,
      system_defined: userCount === 0, // Only super_admin is system-defined
    });

    return success(
      {
        userName: (user as any).username,
        userId: (user as any).id,
        tempPassword: (user as any).tempPassword,
      },
      userCount === 0
        ? "Super admin created successfully"
        : "User signed up successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    //  console.error("Signup Error:", err);
    // console.error("Error stack:", err.stack);
    return error(
      null,
      `${err?.message}` || "Internal server error!",
      err?.code || statusCodes.SERVER_ISSUE
    )(h);
  }
};

export const loginController = async (req: Request, h: ResponseToolkit) => {
  try {
    const { usernameOrEmail, password } = req.payload as LoginPayload;
    if (!usernameOrEmail || !password) {
      return error(
        null,
        "Username or email and password are required!",
        400
      )(h);
    }

    const user: any = await User.findOne({
      where: {
        [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
    });

    if (!user) {
      return error(null, "User not found!", 404)(h);
    }

    // Check if user is active
    if (!user.isActive) {
      return error(null, "User account is inactive!", 403)(h);
    }

    // Verify password based on user type
    let isPasswordMatch = false;
    if (user.system_defined && !user.isTempPassword) {
      // Super_admin: use actual password
      isPasswordMatch = CryptoUtil.verifyPassword(
        password,
        "10",
        user.password
      );
    } else if (user.isTempPassword) {
      // Invited user, first login: use tempPassword
      if (!user.tempPassword) {
        return error(null, "Temporary password not set!", 401)(h);
      }
      isPasswordMatch = CryptoUtil.verifyPassword(
        password,
        "10",
        user.tempPassword
      );
      if (isPasswordMatch) {
        // After successful first login, disable tempPassword
        await user.update({ isTempPassword: false, tempPassword: null });
      }
    } else {
      isPasswordMatch = CryptoUtil.verifyPassword(
        password,
        "10",
        user.password
      );
    }

    if (!isPasswordMatch) {
      return error(null, "Invalid password!", 401)(h);
    }

    const accessToken = JWTUtil.generateAccessToken(user.id, user.roleId);
    const refreshToken = JWTUtil.generateRefreshToken(user.id, user.roleId);

    h.state("accessToken", accessToken, {
      path: "/",
      ttl: process.env.JWT_ACCESS_EXPIRES as any,
      isHttpOnly: true,
    });
    h.state("refreshToken", refreshToken, {
      path: "/",
      ttl: process.env.JWT_ACCESS_EXPIRES as any,
      isHttpOnly: true,
    });

    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
    });

    return success(
      {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          roleId: user.roleId,
          schoolId: user.schoolId,
          isTempPassword: user.isTempPassword,
        },
      },
      "User logged in successfully",
      200
    )(h);
  } catch (err: any) {
    //  console.error("Login Error:", err);
    // console.error("Error stack:", err.stack);
    return error(
      null,
      `${err?.message}` || "Internal server error!",
      err?.code || 500
    )(h);
  }
};

export const logoutController = async (req: Request, h: ResponseToolkit) => {
  try {
    // console.log("236 -->", req.auth);
    // console.log("236 -->",)
    const { userId } = req.auth.credentials as any;

    const deletedCount = await RefreshToken.destroy({ where: { userId } });
    if (deletedCount === 0) {
      return error(null, "Refresh token not found!", 404)(h);
    }

    return success(
      deletedCount,
      "Logout successful. Session terminated.",
      200
    )(h);
  } catch (err: any) {
    //  console.error("Logout Error:", err);
    // console.error("Error stack:", err.stack);
    return error(
      null,
      `${err?.message}` || "Internal server error!",
      err?.code || 500
    )(h);
  }
};

export const refreshController = async (req: Request, h: ResponseToolkit) => {
  try {
    const refreshToken = req.state.refreshToken;
    if (!refreshToken) {
      return error(null, "Refresh token not found!", 404)(h);
    }

    const decoded: any = JWTUtil.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return error(null, "Invalid refresh token!", 401)(h);
    }

    const user: any = await User.findOne({ where: { id: decoded.userId } });
    if (!user) {
      return error(null, "User not found!", 404)(h);
    }
    const currRefresh = await RefreshToken.findOne({
      where: { userId: user.id },
    });
    if (!currRefresh) {
      return error(null, "Refresh token not found or invalid!", 404)(h);
    }

    const newAccessToken = JWTUtil.generateAccessToken(user.id, user.roleId);
    const newRefreshToken = JWTUtil.generateRefreshToken(user.id, user.roleId);

    await RefreshToken.update(
      { token: newRefreshToken },
      { where: { userId: user.id } }
    );
    h.state("accessToken", newAccessToken, {
      path: "/",
      ttl: process.env.JWT_ACCESS_EXPIRES as any,
      isHttpOnly: true,
    });
    h.state("refreshToken", newRefreshToken, {
      path: "/",
      ttl: process.env.JWT_ACCESS_EXPIRES as any,
      isHttpOnly: true,
    });

    return success(
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      "Access token updated successfully with token rotation",
      200
    )(h);
  } catch (err: any) {
    //  console.error("Refresh Error:", err);
    // console.error("Error stack:", err.stack);
    return error(
      null,
      `${err?.message}` || "Internal server error!",
      err?.code || 500
    )(h);
  }
};

export const verifyTokenController = async (
  req: Request,
  h: ResponseToolkit
) => {
  try {
    const accessToken = req.state.accessToken;
    if (!accessToken) {
      return error(null, "Access token not found!", statusCodes.NOT_FOUND)(h);
    }

    const verified = JWTUtil.verifyAccessToken(accessToken);
    if (!verified) {
      return error(null, "Invalid access token!", statusCodes.UNAUTHORIZED)(h);
    }

    return success(
      verified,
      "Access token verified successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    //  console.error("verifyToken Error:", err);
    // console.error("Error stack:", err.stack);
    return error(
      null,
      `${err?.message}` || "Internal server error!",
      err?.code || statusCodes.SERVER_ISSUE
    )(h);
  }
};

export const resetPassword = async (req: Request, h: ResponseToolkit) => {
  try {
    const { usernameOrEmail, newPassword, confirmPassword } =
      req.payload as ResetOrForgotPasswordPayload;
    if (!usernameOrEmail || !newPassword) {
      return error(
        null,
        "Username or email and password are required!",
        400
      )(h);
    }

    const { userId } = req.auth.credentials as any;
    if (!userId) {
      return error(null, "Unauthorized!", statusCodes.UNAUTHORIZED)(h);
    }

    let hashedPassword;
    if (newPassword === confirmPassword) {
      hashedPassword = CryptoUtil.hashPassword(newPassword, "10");
    }

    await User.update(
      { password: hashedPassword },
      {
        where: {
          id: userId,
        },
      }
    );
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return error(null, "User not found!", statusCodes.NOT_FOUND)(h);
    }

    return success(
      user,
      "Password reset successfully.",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    //  console.error("verifyToken Error:", err);
    // console.error("Error stack:", err.stack);
    return error(
      null,
      `${err?.message}` || "Internal server error!",
      err?.code || statusCodes.SERVER_ISSUE
    )(h);
  }
};
