import type { Request, ResponseToolkit } from "@hapi/hapi";
import { error, success } from "../utils/returnFunctions.util";
import { User } from "../models/User.model";
import { Role } from "../models/Role.model";
import { CryptoUtil } from "../utils/crypto.util";
import { JWTUtil } from "../utils/jwtAll.util";
import { Op } from "sequelize";
import type { LoginPayload } from "../interfaces/LoginPayload";
import { RefreshToken } from "../models/RefreshToken.model";
import { statusCodes } from "../config/constants";
import crypto from "crypto";
import type { ResetOrForgotPasswordPayload } from "../interfaces/ResetOrForgotPasswordPayload";
import { sequelize } from "../db/db";
import { Invite } from "../models/Invite.model";
import { Permission } from "../models/Permission.model";
import dotenv from "dotenv";
dotenv.config();

export const signupController = async (req: Request, h: ResponseToolkit) => {
  try {
    const { firstName, email, password }: any = req.payload;
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
    let finalSchoolId;

    if (userCount === 0) {
      // First user must be super_admin, ignore provided role/schoolId
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
    }

    const hashedPassword = CryptoUtil.hashPassword(password, "10");
    const user = await User.create({
      firstName,
      email,
      password: userCount === 0 ? hashedPassword : "",
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
  const transaction = await sequelize.transaction();
  try {
    const { usernameOrEmail, password } = req.payload as LoginPayload;
    // console.log("User: 94 -- ",usernameOrEmail, password)

    const user = (await User.findOne({
      where: {
        [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
      // include: [Role],
      transaction,
    })) as any;

    // console.log("User: 102 -- ",user)

    if (!user) {
      await transaction.rollback();
      return error(null, "User not found!", statusCodes.NOT_FOUND)(h);
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
      // console.log("here 123", user.isTempPassword);
      // console.log("here 124", user.tempPassword);
      // Invited user, first login: use tempPassword
      if (!user.tempPassword) {
        await transaction.rollback();
        return error(
          null,
          "Temporary password not set!",
          statusCodes.UNAUTHORIZED
        )(h);
      }
      isPasswordMatch = CryptoUtil.verifyPassword(
        password,
        "10",
        user.tempPassword
      );
      if (isPasswordMatch) {
        // Disable tempPassword and update invite status
        await user.update(
          { isTempPassword: false, tempPassword: null, isActive: true },
          { transaction }
        );

        const invite = (await Invite.findOne({
          where: { email: user.email, status: "pending" },
          transaction,
        })) as any;
        if (invite) {
          await invite.update({ status: "accepted" }, { transaction });
        }
        // Assign permissions based on role
        const permissions = (await Permission.findAll({
          where: { roleId: invite.roleId, scope: "all" },
          transaction,
        })) as any;
        for (const perm of permissions) {
          await Permission.create(
            {
              title: perm.title,
              userId: user.id,
              setterId: invite.senderId,
              module: perm.module,
              targetType: perm.targetType,
              targetId: perm.targetId,
              action: perm.action,
              scope: "specific",
            },
            { transaction }
          );
        }
      }
    } else {
      isPasswordMatch = CryptoUtil.verifyPassword(
        password,
        "10",
        user.password
      );
    }

    if (!isPasswordMatch) {
      await transaction.rollback();
      return error(null, "Invalid password!", statusCodes.UNAUTHORIZED)(h);
    }

    // Generate tokens
    const accessToken = JWTUtil.generateAccessToken(user.id, user.roleId);
    const refreshToken = JWTUtil.generateRefreshToken(user.id, user.roleId);

    // Store refresh token
    await RefreshToken.create(
      {
        token: refreshToken,
        userId: user.id,
      },
      { transaction }
    );

    // Set cookies
    h.state("accessToken", accessToken, {
      ttl: 1 * 24 * 60 * 60 * 1000, // 1 day
      path: "/",
      // isSecure: process.env.NODE_ENV === "production",
      isHttpOnly: true,
    });

    h.state("refreshToken", refreshToken, {
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
      // isSecure: process.env.NODE_ENV === "production",
      isHttpOnly: true,
    });

    await transaction.commit();
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
          system_defned: user.system_defined,
          isActive: user.isActive,
        },
      },
      "User logged in successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Internal server error!",
      statusCodes.SERVER_ISSUE
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
