import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { User } from "./User.model";
import { School } from "./School.model";

const Complaint = sequelize.define(
  "Complaint",
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
      primaryKey: true,
    },
    subject: {
      type: DataType.STRING,
      allowNull: false,
    },
    description: {
      type: DataType.TEXT,
      allowNull: true,
    },
    userId: {
      type: DataType.UUID,
      allowNull: false,
    },
    schoolId: {
      type: DataType.UUID,
      allowNull: false,
    },
  },
  { tableName: "Complaint", timestamps: true }
);

export { Complaint };
