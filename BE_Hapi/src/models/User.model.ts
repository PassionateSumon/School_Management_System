import crypto from "crypto";
import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { School } from "./School.model";
import { Assignment } from "./Assignment.model";
import { ClassSchedule } from "./ClassSchedule.model";
import { Class } from "./Class.model";
import { Permission } from "./Permission.model";
import { Attendance } from "./Attendance.model";
import { Invite } from "./Invite.model";
import { Complaint } from "./Complaint.model";
import { Role } from "./Role.model";
import { Education } from "./Education.model";
import { ExamSchedule } from "./ExamSchedule.model";
import { Experience } from "./Experience.model";
import { RefreshToken } from "./RefreshToken.model";
import { NoticeBoard } from "./NoticeBoard.model";
import { Department } from "./Department.model";
import { Result } from "./Result.model";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataType.STRING,
      allowNull: false,
      defaultValue: () =>
        `${Math.floor(Date.now() / 1000)}-${crypto.randomUUID()}`,
      unique: true,
    },
    firstName: {
      type: DataType.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataType.STRING,
      allowNull: true,
    },
    email: {
      type: DataType.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataType.STRING,
      allowNull: false,
    },
    tempPassword: {
      type: DataType.STRING,
      allowNull: true,
    },
    address: {
      type: DataType.TEXT,
      allowNull: true,
    },
    phone: {
      type: DataType.STRING,
      allowNull: true,
    },
    specialization: {
      type: DataType.STRING,
      allowNull: true,
    },
    rollNumber: {
      type: DataType.STRING,
      allowNull: true,
    },
    parentEmail: {
      type: DataType.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    profilePicture: {
      type: DataType.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: "Profile picture URL must be up to 500 characters",
        },
      },
    },
    gender: {
      type: DataType.ENUM("male", "female", "other"),
      allowNull: true,
    },
    dateOfBirth: {
      type: DataType.DATEONLY,
      allowNull: true,
    },
    isActive: {
      type: DataType.BOOLEAN,
      defaultValue: true,
    },
    isTempPassword: {
      type: DataType.BOOLEAN,
      defaultValue: true,
    },
    system_defined: {
      type: DataType.BOOLEAN,
      defaultValue: true,
    },
    schoolId: {
      type: DataType.UUID,
      allowNull: true, // because first super_admin will register then school will be made
    },
    roleId: {
      type: DataType.UUID,
      allowNull: false,
    },
    departmentId: {
      type: DataType.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "User",
    timestamps: true,
  }
);

export { User };
export type UserType = typeof User;
