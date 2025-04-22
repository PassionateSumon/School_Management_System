import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";

const ClassSchedule = sequelize.define(
  "ClassSchedule",
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
    teacherId: {
      type: DataType.UUID,
      allowNull: false,
    },
    schoolId: {
      type: DataType.UUID,
      allowNull: false,
    },
    subjectId: {
      type: DataType.UUID,
      allowNull: false,
    },
    date: {
      type: DataType.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataType.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataType.TIME,
      allowNull: false,
      validate: {
        isValid(value: any) {
          if ((this as any).startTime > value) {
            throw new Error("End time must be greater than start time.");
          }
        },
      },
    },
  },
  { tableName: "ClassSchedule", timestamps: true }
);

export { ClassSchedule };
