import { Sequelize } from "sequelize";
import { DataType } from "sequelize-typescript";
import { setupAssociations } from "../models/relations/associations";
import dotenv from "dotenv";
import School from "models/School.model";
import Assignment from "models/Assignment.model";
import Attendance from "models/Attendance.model";
import User from "models/User.model";
import Subject from "models/Subject.model";
import StudentAssignment from "models/StudentAssignment.model";
import Role from "models/Role.model";
import Result from "models/Result.model";
import RefreshToken from "models/RefreshToken.model";
import Permission from "models/Permission.model";
import NoticeBoard from "models/NoticeBoard.model";
import Module from "models/Module.model";
import Invite from "models/Invite.model";
import GradingScale from "models/GradingScale.model";
import Experience from "models/Experience.model";
import Event from "models/Event.model";
import Education from "models/Education.model";
import Department from "models/Department.model";
import Degree from "models/Degree.model";
import Complaint from "models/Complaint.model";
import ClassStudent from "models/ClassStudent.model";
import ClassSchedule from "models/ClassSchedule.model";
import Class from "models/Class.model";
import ExamSchedule from "models/ExamSchedule.model";
dotenv.config();

const { DB_NAME, DB_USERNAME, DB_PASSWORD } = process.env as any;
// console.log(DB_NAME, DB_USERNAME, DB_PASSWORD);

export const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
  logging: false,
});
// console.log("db --> ", sequelize);

const db: any = {};
db.sequelize = sequelize;

db.assignment = Assignment(sequelize, DataType);
db.attendance = Attendance(sequelize, DataType);
db.class = Class(sequelize, DataType);
db.classSchedule = ClassSchedule(sequelize, DataType);
db.classStudent = ClassStudent(sequelize, DataType);
db.complaint = Complaint(sequelize, DataType);
db.degree = Degree(sequelize, DataType);
db.department = Department(sequelize, DataType);
db.education = Education(sequelize, DataType);
db.event = Event(sequelize, DataType);
db.examSchedule = ExamSchedule(sequelize, DataType);
db.experience = Experience(sequelize, DataType);
db.gradingScale = GradingScale(sequelize, DataType);
db.invite = Invite(sequelize, DataType);
db.module = Module(sequelize, DataType);
db.noticeBoard = NoticeBoard(sequelize, DataType);
db.permission = Permission(sequelize, DataType);
db.refreshToken = RefreshToken(sequelize, DataType);
db.result = Result(sequelize, DataType);
db.school = School(sequelize, DataType);
db.role = Role(sequelize, DataType);
db.studentAssignment = StudentAssignment(sequelize, DataType);
db.subject = Subject(sequelize, DataType);
db.user = User(sequelize, DataType);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    
    setupAssociations();
    await sequelize.sync();

    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

export { db, connectDB };
