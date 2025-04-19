import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { School } from "./School.model";
import { ClassSchedule } from "./ClassSchedule.model";
import { ExamSchedule } from "./ExamSchedule.model";
import { Assignment } from "./Assignment.model";

const Subject = sequelize.define(
  "Subject",
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
    code: {
      type: DataType.STRING,
      allowNull: true,
      unique: true,
    },
    schoolId: {
      type: DataType.UUID,
      allowNull: false,
    },
  },
  { tableName: "Subject", timestamps: true }
);

export { Subject };
