import type { Request, ResponseToolkit } from "@hapi/hapi";
import { queueEmail } from "../services/emailQueue.service";
import { error, success } from "../utils/returnFunctions.util";
import { statusCodes } from "../config/constants";
import { Invite } from "../models/Invite.model";
import { User } from "../models/User.model";
import { CryptoUtil } from "../utils/crypto.util";
import crypto from "crypto";
import { School } from "../models/School.model";
import { Role } from "../models/Role.model";
import { ClassStudent } from "../models/ClassStudent.model";
import { Class } from "../models/Class.model";
import { sequelize } from "../db/db";
import type { CreateInvitePayload } from "../interfaces/EmailInterfaces";
import { Op } from "sequelize";
import { Permission } from "../models/Permission.model";

const INVITE_EXPIRY_DAYS = 7;
// send invite email
const sendInviteEmail = async (
  invite: any,
  user: any,
  tempPassword: string
) => {
  const token = invite.id;
  const loginUrl = `${process.env.DEV_ORIGIN}/login?token=${token}`;
  const emailContent = `
    Welcome to the School Management System!
    Username: ${user.username}
    Temporary Password: ${tempPassword}
    Login at: ${loginUrl}
    Expires on: ${invite.expiresAt}
  `;
  await queueEmail({
    to: user.email,
    subject: "Invitation to Join School",
    text: emailContent,
  });
};
// ----------------------------------------------------------------------------
export const createAndSendInvite = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { email, role, classId, firstName, lastName, priority } =
    request.payload as CreateInvitePayload & { priority?: number };
  const sender = request.auth.credentials as any;

  // Validate inputs
  if (!email || !role || !firstName) {
    return error(
      null,
      "Email, role, and firstName are required",
      statusCodes.BAD_REQUEST
    )(h);
  }
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return error(null, "Invalid email format", statusCodes.BAD_REQUEST)(h);
  }

  // Start transaction
  const transaction = await sequelize.transaction();
  try {
    // Find or create role
    let roleRecord = (await Role.findOne({
      where: {
        title: { [Op.iLike]: role },
        schoolId: sender.schoolId,
      },
      transaction,
    })) as any;
    if (!roleRecord) {
      roleRecord = await Role.create(
        { title: role, schoolId: sender.schoolId, priority: priority || 999 },
        { transaction }
      );
    }

    // Check school
    const school = (await School.findByPk(sender.schoolId, {
      transaction,
    })) as any;
    if (!school) {
      await transaction.rollback();
      return error(null, "School not found", statusCodes.NOT_FOUND)(h);
    }

    // Check if user exists
    let user = (await User.findOne({ where: { email }, transaction })) as any;
    if (user && user.isActive && user.schoolId === sender.schoolId) {
      await transaction.rollback();
      return error(
        null,
        "User already registered and active in this school",
        statusCodes.CNFLICT
      )(h);
    }

    // Create user if not exists
    let tempPassword: string;
    if (!user) {
      tempPassword = CryptoUtil.generateTempPassword();
      const hashedPassword = CryptoUtil.hashPassword(
        tempPassword,
        roleRecord.id
      );
      user = (await User.create(
        {
          username: crypto.randomUUID(),
          email,
          firstName,
          lastName,
          password: hashedPassword,
          tempPassword: hashedPassword,
          isTempPassword: true,
          isActive: false,
          schoolId: sender.schoolId,
          roleId: roleRecord.id,
        },
        { transaction }
      )) as any;
    } else {
      // Update existing inactive user
      tempPassword = CryptoUtil.generateTempPassword();
      user.tempPassword = CryptoUtil.hashPassword(tempPassword, roleRecord.id);
      user.roleId = roleRecord.id;
      user.isTempPassword = true;
      await user.save({ transaction });
    }

    // Check for existing pending invite
    const existingInvite = (await Invite.findOne({
      where: {
        receiverId: user.id,
        schoolId: sender.schoolId,
        status: "pending",
      },
      transaction,
    })) as any;
    if (existingInvite) {
      await transaction.rollback();
      return error(
        null,
        "User already has a pending invite for this school",
        statusCodes.CNFLICT
      )(h);
    }

    // Create invite
    const expiresAt = new Date(
      Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );
    const invite = (await Invite.create(
      {
        senderId: sender.id,
        receiverId: user.id,
        schoolId: sender.schoolId,
        roleId: roleRecord.id,
        status: "pending",
        expiresAt,
        resendCount: 0,
      },
      { transaction }
    )) as any;

    // Link to class if classId provided and role is "student"
    if (classId && role.toLowerCase() === "student") {
      const classRecord = await Class.findOne({
        where: { id: classId, schoolId: sender.schoolId },
        transaction,
      });
      if (!classRecord) {
        await transaction.rollback();
        return error(
          null,
          "Invalid or inaccessible class",
          statusCodes.BAD_REQUEST
        )(h);
      }
      await ClassStudent.create(
        { classId, studentId: user.id },
        { transaction }
      );
    } else if (classId && role.toLowerCase() !== "student") {
      await transaction.rollback();
      return error(
        null,
        "Class assignment only allowed for student role",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Commit transaction
    await transaction.commit();

    // Send email with only username and temp password
    try {
      await sendInviteEmail(invite, user, tempPassword);
    } catch (err) {
      return error(null, "Failed to send email", statusCodes.SERVER_ISSUE)(h);
    }

    return success(
      {
        inviteId: invite.id,
        receiver: { email, username: user.username },
      },
      "Invite sent successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to send invite",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

export const resendInvite = async (request: Request, h: ResponseToolkit) => {
  const { inviteId } = request.params;
  const sender = request.auth.credentials as any;

  // Start transaction
  const transaction = await sequelize.transaction();
  try {
    // Find invite
    const invite = (await Invite.findByPk(inviteId, {
      include: [
        { model: User, as: "receiver" },
        { model: School },
        { model: Role },
      ],
      transaction,
    })) as any;
    if (!invite) {
      await transaction.rollback();
      return error(null, "Invite not found", statusCodes.NOT_FOUND)(h);
    }

    // Validate invite
    if (invite.senderId !== sender.id || invite.schoolId !== sender.schoolId) {
      await transaction.rollback();
      return error(
        null,
        "Not authorized to resend this invite",
        statusCodes.PERMISSION_DENIED
      )(h);
    }
    if (invite.status !== "pending") {
      await transaction.rollback();
      return error(
        null,
        "Invite is not in pending status",
        statusCodes.BAD_REQUEST
      )(h);
    }

    // Update resend count and expiry
    const now = new Date();
    if (invite.expiresAt < now) {
      invite.expiresAt = new Date(
        now.getTime() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      );
    }
    invite.resendCount += 1;
    await invite.save({ transaction });

    // Get user and regenerate tempPassword
    const user = invite.receiver;
    if (!user) {
      await transaction.rollback();
      return error(null, "Receiver not found", statusCodes.BAD_REQUEST)(h);
    }
    const tempPassword = CryptoUtil.generateTempPassword();
    user.tempPassword = CryptoUtil.hashPassword(tempPassword, user.roleId);
    await user.save({ transaction });

    // Commit transaction
    await transaction.commit();

    // Resend email with only username and temp password
    try {
      await sendInviteEmail(invite, user, tempPassword);
    } catch (err) {
      return error(null, "Failed to resend email", statusCodes.SERVER_ISSUE)(h);
    }

    return success(
      { inviteId: invite.id },
      "Invite resent successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to resend invite",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

export const listInvites = async (request: Request, h: ResponseToolkit) => {
  const { userId } = request.auth.credentials as any;
  const { role, status } = request.query as any;
  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const where: any = {
      schoolId: user.schoolId,
    };

    if (status) {
      where.status = status.toLowerCase();
    }
    if (role) {
      const roleRecord = (await Role.findOne({
        where: { title: { [Op.iLike]: role }, schoolId: user.schoolId },
      })) as any;
      if (!roleRecord) {
        return error(null, "Role not found", statusCodes.NOT_FOUND)(h);
      }
      where.roleId = roleRecord.id;
    }

    const invites = await Invite.findAll({
      where,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "email", "firstName", "lastName"],
        },
        { model: Role, attributes: ["id", "title"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return success(
      invites,
      "Invites retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    console.error(err);
    return error(
      null,
      err.message || "Failed to list invites",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

export const getInviteDetails = async (
  request: Request,
  h: ResponseToolkit
) => {
  const { userId } = request.auth.credentials as any;
  const { inviteId } = request.params as any;
  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const invite = (await Invite.findByPk(inviteId, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "email", "firstName", "lastName"],
        },
        { model: Role, attributes: ["id", "title"] },
        { model: School, attributes: ["id", "name"] },
      ],
    })) as any;

    if (!invite) {
      return error(null, "Invite not found", statusCodes.NOT_FOUND)(h);
    }
    if (invite.schoolId !== user.schoolId) {
      return error(
        null,
        "Not authorized to view this invite",
        statusCodes.PERMISSION_DENIED
      )(h);
    }

    return success(
      invite,
      "Invite details retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    console.error(err);
    return error(
      null,
      err.message || "Failed to get invite details",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

export const cancelInvite = async (request: Request, h: ResponseToolkit) => {
  const { userId } = request.auth.credentials as any;
  const { inviteId } = request.params as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }
    const invite = (await Invite.findByPk(inviteId, {
      include: [{ model: User, as: "receiver" }],
      transaction,
    })) as any;

    if (!invite) {
      await transaction.rollback();
      return error(null, "Invite not found", statusCodes.NOT_FOUND)(h);
    }

    if (invite.senderId !== userId || invite.schoolId !== user.schoolId) {
      await transaction.rollback();
      return error(
        null,
        "Not authorized to cancel this invite",
        statusCodes.PERMISSION_DENIED
      )(h);
    }

    if (invite.status !== "pending") {
      await transaction.rollback();
      return error(
        null,
        "Only pending invites can be cancelled",
        statusCodes.BAD_REQUEST
      )(h);
    }
    invite.status = "rejected";
    await invite.save({ transaction });

    const receiver = invite.receiver;
    if (receiver && !receiver.isActive) {
      receiver.isActive = false;
      await receiver.save({ transaction });
    }

    await transaction.commit();
    return success(
      null,
      "Invite cancelled successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to cancel invite",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

export const updateInvite = async (request: Request, h: ResponseToolkit) => {
  const { inviteId } = request.params;
  const { role, classId, priority } = request.payload as {
    role?: string;
    classId?: string;
    priority?: number;
  };
  const { userId } = request.auth.credentials as any;

  const transaction = await sequelize.transaction();
  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const invite = (await Invite.findByPk(inviteId, {
      include: [{ model: User, as: "receiver" }, { model: Role }],
      transaction,
    })) as any;

    if (!invite) {
      await transaction.rollback();
      return error(null, "Invite not found", statusCodes.NOT_FOUND)(h);
    }

    if (invite.senderId !== userId || invite.schoolId !== user.schoolId) {
      await transaction.rollback();
      return error(
        null,
        "Not authorized to update this invite",
        statusCodes.PERMISSION_DENIED
      )(h);
    }

    if (invite.status !== "pending") {
      await transaction.rollback();
      return error(
        null,
        "Only pending invites can be updated",
        statusCodes.BAD_REQUEST
      )(h);
    }

    if (role) {
      let roleRecord = (await Role.findOne({
        where: {
          title: { [Op.iLike]: role },
          schoolId: user.schoolId,
        },
        transaction,
      })) as any;
      if (!roleRecord) {
        roleRecord = await Role.create(
          {
            title: role,
            schoolId: user.schoolId,
            priority: priority || 999,
          },
          { transaction }
        );
      }
      invite.roleId = roleRecord.id;
    }

    if (classId && invite.role.title.toLowerCase() === "student") {
      const classRecord = await Class.findOne({
        where: { id: classId, schoolId: user.schoolId },
        transaction,
      });
      if (!classRecord) {
        await transaction.rollback();
        return error(
          null,
          "Invalid or inaccessible class",
          statusCodes.BAD_REQUEST
        )(h);
      }
      const existingClassStudent = await ClassStudent.findOne({
        where: { studentId: invite.receiver.id, classId },
        transaction,
      });
      if (!existingClassStudent) {
        await ClassStudent.create(
          { classId, studentId: invite.receiver.id },
          { transaction }
        );
      }
    } else if (classId && invite.role.title.toLowerCase() !== "student") {
      await transaction.rollback();
      return error(
        null,
        "Class assignment only allowed for student role",
        statusCodes.BAD_REQUEST
      )(h);
    }

    await invite.save({ transaction });
    await transaction.commit();

    return success(
      { inviteId: invite.id },
      "Invite updated successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to update invite",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// Bulk Create Invites
export const bulkCreateInvites = async (
  request: Request,
  h: ResponseToolkit
) => {
  const invites = request.payload as (CreateInvitePayload & {
    priority?: number;
  })[];
  const { userId } = request.auth.credentials as any;

  if (!Array.isArray(invites) || invites.length === 0) {
    return error(
      null,
      "Payload must be a non-empty array of invites",
      statusCodes.BAD_REQUEST
    )(h);
  }

  const transaction = await sequelize.transaction();
  const createdInvites: any[] = [];

  try {
    const user = (await User.findByPk(userId)) as any;
    if (!user || !user.schoolId) {
      await transaction.rollback();
      return error(null, "User or school not found", statusCodes.NOT_FOUND)(h);
    }

    const school = await School.findByPk(user.schoolId, { transaction });
    if (!school) {
      await transaction.rollback();
      return error(null, "School not found", statusCodes.NOT_FOUND)(h);
    }

    for (const inviteData of invites) {
      const { email, role, classId, firstName, lastName, priority } =
        inviteData;

      if (!email || !role || !firstName) {
        await transaction.rollback();
        return error(
          null,
          "Email, role, and firstName are required for all invites",
          statusCodes.BAD_REQUEST
        )(h);
      }
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        await transaction.rollback();
        return error(
          null,
          `Invalid email format: ${email}`,
          statusCodes.BAD_REQUEST
        )(h);
      }

      let roleRecord = (await Role.findOne({
        where: {
          title: { [Op.iLike]: role },
          schoolId: user.schoolId,
        },
        transaction,
      })) as any;
      if (!roleRecord) {
        roleRecord = await Role.create(
          {
            title: role,
            schoolId: user.schoolId,
            priority: priority || 999,
          },
          { transaction }
        );
      }

      let inviteUser = (await User.findOne({
        where: { email },
        transaction,
      })) as any;
      if (
        inviteUser &&
        inviteUser.isActive &&
        inviteUser.schoolId === user.schoolId
      ) {
        await transaction.rollback();
        return error(
          null,
          `User with email ${email} already registered and active`,
          statusCodes.CNFLICT
        )(h);
      }

      let tempPassword: string;
      if (!inviteUser) {
        tempPassword = CryptoUtil.generateTempPassword();
        const hashedPassword = CryptoUtil.hashPassword(
          tempPassword,
          roleRecord.id
        );
        inviteUser = (await User.create(
          {
            username: crypto.randomUUID(),
            email,
            firstName,
            lastName,
            password: hashedPassword,
            tempPassword: hashedPassword,
            isTempPassword: true,
            isActive: false,
            schoolId: user.schoolId,
            roleId: roleRecord.id,
          },
          { transaction }
        )) as any;
      } else {
        tempPassword = CryptoUtil.generateTempPassword();
        inviteUser.tempPassword = CryptoUtil.hashPassword(
          tempPassword,
          roleRecord.id
        );
        inviteUser.roleId = roleRecord.id;
        inviteUser.isTempPassword = true;
        await inviteUser.save({ transaction });
      }

      const existingInvite = (await Invite.findOne({
        where: {
          receiverId: inviteUser.id,
          schoolId: user.schoolId,
          status: "pending",
        },
        transaction,
      })) as any;
      if (existingInvite) {
        await transaction.rollback();
        return error(
          null,
          `User with email ${email} already has a pending invite`,
          statusCodes.CNFLICT
        )(h);
      }

      const expiresAt = new Date(
        Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      );
      const invite = (await Invite.create(
        {
          senderId: userId,
          receiverId: inviteUser.id,
          schoolId: user.schoolId,
          roleId: roleRecord.id,
          status: "pending",
          expiresAt,
          resendCount: 0,
        },
        { transaction }
      )) as any;

      if (classId && role.toLowerCase() === "student") {
        const classRecord = (await Class.findOne({
          where: { id: classId, schoolId: user.schoolId },
          transaction,
        })) as any;
        if (!classRecord) {
          await transaction.rollback();
          return error(
            null,
            `Invalid or inaccessible class for email ${email}`,
            statusCodes.BAD_REQUEST
          )(h);
        }
        await ClassStudent.create(
          { classId, studentId: inviteUser.id },
          { transaction }
        );
      } else if (classId && role.toLowerCase() !== "student") {
        await transaction.rollback();
        return error(
          null,
          `Class assignment only allowed for student role for email ${email}`,
          statusCodes.BAD_REQUEST
        )(h);
      }

      createdInvites.push({
        inviteId: invite.id,
        email,
        username: inviteUser.username,
      });
      await sendInviteEmail(invite, inviteUser, tempPassword);
    }

    await transaction.commit();
    return success(
      createdInvites,
      "Invites created and sent successfully",
      statusCodes.NEW_RESOURCE
    )(h);
  } catch (err: any) {
    await transaction.rollback();
    return error(
      null,
      err.message || "Failed to create bulk invites",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};

// List User Invites
export const listUserInvites = async (request: Request, h: ResponseToolkit) => {
  const { userId } = request.auth.credentials as any;
  const { status } = request.query as { status?: string };

  try {
    const where: any = { receiverId: userId };
    if (status) {
      where.status = status.toLowerCase();
    }

    const invites = await Invite.findAll({
      where,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: School, attributes: ["id", "name"] },
        { model: Role, attributes: ["id", "title"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return success(
      invites,
      "User invites retrieved successfully",
      statusCodes.SUCCESS
    )(h);
  } catch (err: any) {
    return error(
      null,
      err.message || "Failed to list user invites",
      statusCodes.SERVER_ISSUE
    )(h);
  }
};
