import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { School } from "./School.model";
import { User } from "./User.model";
import { Event } from "./Event.model";
import { ClassSchedule } from "./ClassSchedule.model";
import { ExamSchedule } from "./ExamSchedule.model";
import { NoticeBoard } from "./NoticeBoard.model";
import { Assignment } from "./Assignment.model";
import { Department } from "./Department.model";

const Class = sequelize.define(
  "Class",
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
    schoolId: {
      type: DataType.UUID,
      allowNull: false,
    },
    departmentId: {
      type: DataType.UUID,
      allowNull: true,
    },
  },
  { tableName: "Class", timestamps: true }
);

export { Class };
