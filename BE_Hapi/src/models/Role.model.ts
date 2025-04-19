import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { User } from "./User.model";
import { School } from "./School.model";

const Role = sequelize.define(
  "Role",
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
    schoolId: {
      type: DataType.UUID,
      allowNull: false,
    },
  },
  { tableName: "Role", timestamps: true }
);

export { Role };
