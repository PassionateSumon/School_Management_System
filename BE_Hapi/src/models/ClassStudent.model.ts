import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { Class } from "./Class.model";
import { User } from "./User.model";

const ClassStudent = sequelize.define(
  "ClassStudent",
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
      primaryKey: true,
    },
    classId: {
      type: DataType.UUID,
      allowNull: false,
    },
    studentId: {
      type: DataType.UUID,
      allowNull: false,
    },
  },
  { tableName: "ClassStudent", timestamps: true }
);
export { ClassStudent };
