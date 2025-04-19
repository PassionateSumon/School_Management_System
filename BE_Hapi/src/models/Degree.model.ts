import { DataTypes } from "sequelize";
import { sequelize } from "../db/db";
import { School } from "./School.model";

const Degree = sequelize.define("Degree", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  schoolId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {tableName: "Degree", timestamps: true});
export { Degree };
