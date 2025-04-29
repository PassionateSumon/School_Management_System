import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { Permission } from "./Permission.model";
import { School } from "./School.model";

const Module = sequelize.define(
  "Module",
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataType.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 200],
      },
    },
    schoolId: {
      type: DataType.UUID,
      allowNull: false,
    },
  },
  { tableName: "Module", timestamps: true, indexes: [{ fields: ["name"] }] }
);

export { Module };
