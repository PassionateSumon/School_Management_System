import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { Invite } from "./Invite.model";
import { Class } from "./Class.model";
import { User } from "./User.model";
import { Event } from "./Event.model";
import { ClassSchedule } from "./ClassSchedule.model";
import { Complaint } from "./Complaint.model";
import { Role } from "./Role.model";
import { ExamSchedule } from "./ExamSchedule.model";
import { Experience } from "./Experience.model";
import { NoticeBoard } from "./NoticeBoard.model";
import { Assignment } from "./Assignment.model";
import { Module } from "./Module.model";
import { GradingScale } from "./GradingScale.model";
import { Degree } from "./Degree.model";

const School = sequelize.define(
  "School",
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataType.STRING,
      allowNull: false,
    },
    address: {
      type: DataType.TEXT,
      allowNull: true,
    },
    contactEmail: {
      type: DataType.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    gradeScaleId: {
      type: DataType.UUID,
      allowNull: true,
    },
    isActive: {
      type: DataType.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "School",
    timestamps: true,
  }
);

export { School };
