import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { School } from "./School.model";
import { Class } from "./Class.model";

const Event = sequelize.define(
  "Event",
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataType.STRING,
      allowNull: false,
    },
    description: {
      type: DataType.TEXT,
      allowNull: true,
    },
    date: {
      type: DataType.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataType.TIME,
      allowNull: false,
    },
    classId: {
      type: DataType.UUID,
      allowNull: true,
    },
    schoolId: {
      type: DataType.UUID,
      allowNull: false,
    },
    departmentId: {
      type: DataType.UUID,
      allowNull: true,
    },
    scope: {
      type: DataType.ENUM("school", "class", "department"),
      allowNull: false,
      defaultValue: "class",
    },
  },
  { tableName: "Event", timestamps: true }
);

export { Event };
