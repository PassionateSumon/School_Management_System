import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { User } from "./User.model";
import { School } from "./School.model";
import { Class } from "./Class.model";
import { Department } from "./Department.model";

const NoticeBoard = sequelize.define(
  "NoticeBoard",
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
      primaryKey: true,
    },
    notice: {
      type: DataType.TEXT,
      allowNull: false,
    },
    userId: {
      type: DataType.UUID,
      allowNull: false,
    },
    schoolId: {
      type: DataType.UUID,
      allowNull: false,
    },
    classId: {
      type: DataType.UUID,
      allowNull: true, // Optional field for class-specific notices
    },
    departmentId: {
      type: DataType.UUID,
      allowNull: true, // Optional field for department-specific notices
    },
    status: {
      type: DataType.ENUM("Draft", "Published", "Completed"),
      allowNull: false,
      defaultValue: "Draft",
    },
    publishedAt: {
      type: DataType.DATE,
      allowNull: false,
      defaultValue: DataType.NOW,
    },
    file: {
      type: DataType.STRING,
      allowNull: true, // Optional field for file attachments
      validate: {
        len: {
          args: [0, 500],
          msg: "File URL must be up to 500 characters",
        },
        is: {
          args: [/^(https?:\/\/)/],
          msg: "File must be a valid URL",
        },
      },
    },
  },
  { tableName: "NoticeBoard", timestamps: true }
);

export { NoticeBoard };
