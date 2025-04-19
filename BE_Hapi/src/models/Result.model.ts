import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { User } from "./User.model";
import { Class } from "./Class.model";
import { School } from "./School.model";
import { Assignment } from "./Assignment.model";
import { ExamSchedule } from "./ExamSchedule.model";

const Result = sequelize.define(
  "Result",
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataType.UUID,
      allowNull: false,
    },
    classId: {
      type: DataType.UUID,
      allowNull: false,
    },
    teacherId: {
      type: DataType.UUID,
      allowNull: false,
    },
    schoolId: {
      type: DataType.UUID,
      allowNull: false,
    },
    assignmentId: {
      type: DataType.UUID,
      allowNull: true,
    },
    examScheduleId: {
      type: DataType.UUID,
      allowNull: true,
    },
    subjectId: {
      type: DataType.UUID,
      allowNull: true,
    },
    file: {
      type: DataType.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [1, 500],
          msg: "File path or URL must be between 1 and 500 characters",
        },
        is: {
          args: [/^(https?:\/\/|\/)/],
          msg: "File must be a valid URL or file path",
        },
      },
    },
    grade: {
      type: DataType.STRING,
      allowNull: false,
    },
    maxPoints: {
      type: DataType.FLOAT,
      allowNull: true,
    },
    obtainedPoints: {
      type: DataType.FLOAT,
      allowNull: true,
    },
  },
  { tableName: "Result", timestamps: true }
);

export { Result };
