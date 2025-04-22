import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { User } from "./User.model";
import { Module } from "./Module.model";

const Permission = sequelize.define(
  "Permission",
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
    userId: {
      type: DataType.UUID,
      allowNull: true,
    },
    setterId: {
      type: DataType.UUID,
      allowNull: false,
    },
    roleId: {
      type: DataType.UUID,
      allowNull: true,
    },
    moduleId: {
      type: DataType.UUID,
      allowNull: false,
    },
    targetType: {
      type: DataType.STRING, // ("school", "class", "event", "notice")
      allowNull: false,
    },
    targetId: {
      // ID of the resource (like classId, schoolId)
      type: DataType.UUID,
      allowNull: true,
    },
    action: {
      type: DataType.STRING,
      allowNull: false,
    },
    scope: {
      type: DataType.ENUM("specific", "all"),
      allowNull: false,
      defaultValue: "specific",
    },
  },
  {
    tableName: "Permission",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["roleId"] },
      { fields: ["targetId"] },
      { fields: ["moduleId"] },
      { fields: ["targetType"] },
    ],
  }
);

export { Permission };
export type PermissionType = typeof Permission;
