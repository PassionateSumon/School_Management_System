import { DataType } from "sequelize-typescript";
import { sequelize } from "../db/db";
import { User } from "./User.model";

const RefreshToken = sequelize.define(
  "RefreshToken",
  {
    id: {
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
      primaryKey: true,
    },
    token: {
      type: DataType.STRING(350),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataType.DATE,
      allowNull: true,
      validate: {
        isFuture(value: Date) {
          if (value <= new Date()) {
            throw new Error("Expiration date must be in the future.");
          }
        },
      },
    },
    userId: {
      type: DataType.UUID,
      allowNull: false,
    },
  },
  { tableName: "RefreshToken", timestamps: true }
);

export { RefreshToken };
