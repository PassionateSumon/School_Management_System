import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const { DB_NAME, DB_USERNAME, DB_PASSWORD } = process.env as any;
// console.log(DB_NAME, DB_USERNAME, DB_PASSWORD);

const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    await sequelize.sync();

    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

export { connectDB, sequelize };
