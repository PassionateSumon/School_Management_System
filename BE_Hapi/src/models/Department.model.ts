import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { School } from "./School.model";
import { Class } from "./Class.model";
import { User } from "./User.model";

const Department = sequelize.define(
  "Department",
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
  },
  { tableName: "Department", timestamps: true }
);

export { Department };
