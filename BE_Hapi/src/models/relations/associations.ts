import { db } from "../../db/db";

export const setupAssociations = () => {
  const {
    assignment: Assignment,
    attendance: Attendance,
    classSchedule: ClassSchedule,
    classStudent: ClassStudent,
    class: Class,
    complaint: Complaint,
    degree: Degree,
    department: Department,
    education: Education,
    experience: Experience,
    event: Event,
    examSchedule: ExamSchedule,
    gradingScale: GradingScale,
    invite: Invite,
    module: Module,
    permission: Permission,
    refreshToken: RefreshToken,
    studentAssignment: StudentAssignment,
    result: Result,
    noticeBoard: NoticeBoard,
    school: School,
    subject: Subject,
    role: Role,
    user: User,
  } = db;

  Assignment.belongsTo(Subject, { foreignKey: "subjectId", targetKey: "id" });
  Assignment.belongsTo(School, { foreignKey: "schoolId", targetKey: "id" });
  Assignment.belongsTo(Class, { foreignKey: "classId", targetKey: "id" });
  Assignment.belongsTo(User, { foreignKey: "teacherId", targetKey: "id" });
  Assignment.belongsToMany(User, {
    through: "StudentAssignment",
    foreignKey: "assignmentId",
    otherKey: "studentId",
  });

  //*************************/

  Attendance.belongsTo(ClassSchedule, {
    foreignKey: "classScheduleId",
    targetKey: "id",
  });
  Attendance.belongsTo(User, {
    foreignKey: "userId",
    targetKey: "id",
    as: "students",
  });
  Attendance.belongsTo(User, {
    foreignKey: "markedById",
    targetKey: "id",
    as: "markedBy",
  });
  User.hasMany(Attendance, {
    foreignKey: "userId",
    sourceKey: "id",
    // as: "attendances",
  });
  User.hasMany(Attendance, {
    foreignKey: "markedById",
    sourceKey: "id",
    // as: "markedAttendances",
  });

  //*********************** */

  Class.belongsTo(School, { foreignKey: "schoolId", targetKey: "id" });
  Class.belongsTo(Department, { foreignKey: "departmentId", targetKey: "id" });
  Class.belongsToMany(User, {
    through: "ClassStudent",
    foreignKey: "classId",
    otherKey: "studentId",
  });
  Class.hasMany(Event, {
    foreignKey: "classId",
    sourceKey: "id",
    as: "events",
  });
  Class.hasMany(ClassSchedule, {
    foreignKey: "classId",
    sourceKey: "id",
    as: "scheduledClasses",
  });
  Class.hasMany(ExamSchedule, {
    foreignKey: "classId",
    sourceKey: "id",
    as: "examSchedules",
  });
  Class.hasMany(NoticeBoard, {
    foreignKey: "classId",
    sourceKey: "id",
    as: "notices",
  });
  Class.hasMany(Assignment, {
    foreignKey: "classId",
    sourceKey: "id",
    as: "assignments",
  });
  Class.hasMany(Complaint, {
    foreignKey: "classId",
    sourceKey: "id",
    as: "complaints",
  });
  Class.hasMany(Result, {
    foreignKey: "classId",
    sourceKey: "id",
    as: "results",
  });
  //************** */

  ClassSchedule.belongsTo(Class, { foreignKey: "classId", targetKey: "id" });
  ClassSchedule.belongsTo(User, { foreignKey: "teacherId", targetKey: "id", as: "teacher" });
  ClassSchedule.belongsTo(School, { foreignKey: "schoolId", targetKey: "id" });
  ClassSchedule.hasMany(Attendance, {
    foreignKey: "classScheduleId",
    sourceKey: "id",
    as: "attendances",
  });
  ClassSchedule.belongsTo(Subject, {
    foreignKey: "subjectId",
    targetKey: "id",
  });

  //******************** */

  ClassStudent.belongsTo(Class, { foreignKey: "classId", targetKey: "id" });
  ClassStudent.belongsTo(User, { foreignKey: "studentId", targetKey: "id" });

  //********** */

  Complaint.belongsTo(User, { foreignKey: "userId", targetKey: "id" });
  Complaint.belongsTo(School, { foreignKey: "schoolId", targetKey: "id" });
  Complaint.belongsTo(Class, { foreignKey: "classId", targetKey: "id" });
  //******** */

  Degree.belongsTo(School, { foreignKey: "schoolId", targetKey: "id" });
  //****** */

  Department.belongsTo(School, { foreignKey: "schoolId", targetKey: "id" });
  Department.hasMany(Class, { foreignKey: "departmentId", sourceKey: "id" });
  Department.hasMany(User, { foreignKey: "departmentId", sourceKey: "id" });
  Department.hasMany(Event, {
    foreignKey: "departmentId",
    sourceKey: "id",
    as: "events",
  });
  //************* */

  Education.belongsTo(User, { foreignKey: "userId", targetKey: "id" });
  //********* */

  Event.belongsTo(School, { foreignKey: "schoolId", targetKey: "id" });
  Event.belongsTo(Class, { foreignKey: "classId", targetKey: "id" });
  Event.belongsTo(Department, {
    foreignKey: "departmentId",
    targetKey: "id",
    as: "department",
  });
  //*************/

  ExamSchedule.belongsTo(Class, {
    foreignKey: "classId",
    targetKey: "id",
    onDelete: "RESTRICT",
  });
  ExamSchedule.belongsTo(School, {
    foreignKey: "schoolId",
    targetKey: "id",
    onDelete: "RESTRICT",
  });
  ExamSchedule.belongsTo(User, {
    foreignKey: "invigilatorId",
    targetKey: "id",
    as: "invigilator",
    onDelete: "SET NULL",
  });
  ExamSchedule.belongsTo(Subject, { foreignKey: "subjectId", targetKey: "id" });
  //*********/

  Experience.belongsTo(User, { foreignKey: "userId", targetKey: "id" });
  //*********/

  GradingScale.belongsTo(School, { foreignKey: "schoolId", targetKey: "id" });
  GradingScale.hasOne(School, {
    foreignKey: "gradeScaleId",
    sourceKey: "id",
    as: "school",
  });
  //*********/

  Invite.belongsTo(School, { foreignKey: "schoolId", targetKey: "id" });
  Invite.belongsTo(User, {
    foreignKey: "senderId",
    targetKey: "id",
    as: "sender",
  });
  Invite.belongsTo(User, {
    foreignKey: "receiverId",
    targetKey: "id",
    as: "receiver",
    onDelete: "SET NULL",
  });
  Invite.belongsTo(Role, { foreignKey: "roleId", targetKey: "id" });
  User.hasMany(Invite, {
    foreignKey: "senderId",
    sourceKey: "id",
    as: "sentInvites",
  });
  User.hasMany(Invite, {
    foreignKey: "receiverId",
    sourceKey: "id",
    as: "receivedInvites",
  });
  //**********/

  Module.belongsTo(School, { foreignKey: "schoolId", targetKey: "id" });
  Module.hasMany(Permission, {
    foreignKey: "moduleId",
    sourceKey: "id",
    as: "permissions",
  });
  //*******/

  NoticeBoard.belongsTo(User, {
    foreignKey: "userId",
    targetKey: "id",
    as: "user",
  });
  NoticeBoard.belongsTo(School, {
    foreignKey: "schoolId",
    targetKey: "id",
    as: "school",
  });
  NoticeBoard.belongsTo(Class, {
    foreignKey: "classId",
    targetKey: "id",
    as: "class",
  });
  NoticeBoard.belongsTo(Department, {
    foreignKey: "departmentId",
    targetKey: "id",
    as: "department",
  });
  //*********/

  Permission.belongsTo(Role, {
    foreignKey: "roleId",
    targetKey: "id",
    as: "role",
  });
  Permission.belongsTo(User, {
    foreignKey: "userId",
    targetKey: "id",
    as: "recipient",
  });
  Permission.belongsTo(User, {
    foreignKey: "setterId",
    targetKey: "id",
    as: "setter",
  });
  Permission.belongsTo(Module, {
    foreignKey: "moduleId",
    targetKey: "id",
    as: "module",
  });
  //********/

  RefreshToken.belongsTo(User, {
    foreignKey: "userId",
    targetKey: "id",
    as: "user",
  });
  //**********/

  Result.belongsTo(User, {
    foreignKey: "studentId",
    targetKey: "id",
    as: "student",
  });
  Result.belongsTo(User, {
    foreignKey: "teacherId",
    targetKey: "id",
    as: "teacher",
  });
  Result.belongsTo(Class, {
    foreignKey: "classId",
    targetKey: "id",
    as: "class",
  });
  Result.belongsTo(School, {
    foreignKey: "schoolId",
    targetKey: "id",
    as: "school",
  });
  Result.belongsTo(Assignment, {
    foreignKey: "assignmentId",
    targetKey: "id",
    as: "assignment",
  });
  Result.belongsTo(ExamSchedule, {
    foreignKey: "examScheduleId",
    targetKey: "id",
    as: "examSchedule",
  });
  Result.belongsTo(Subject, {
    foreignKey: "subjectId",
    targetKey: "id",
    as: "subject",
  });
  //************/

  Role.belongsTo(School, {
    foreignKey: "schoolId",
    targetKey: "id",
    as: "role",
  });
  Role.hasMany(User, {
    foreignKey: "roleId",
    sourceKey: "id",
    as: "users",
  });
  Role.hasMany(Permission, {
    foreignKey: "roleId",
    sourceKey: "id",
    as: "permissions",
  });
  //*********/

  School.belongsTo(GradingScale, {
    foreignKey: "gradeScaleId",
    targetKey: "id",
    as: "gradeScale",
  });
  School.hasMany(Degree, {
    foreignKey: "schoolId",
    sourceKey: "id",
    as: "degrees",
  });
  School.hasMany(Module, {
    foreignKey: "schoolId",
    sourceKey: "id",
    as: "modules",
  });
  School.hasMany(Class, {
    foreignKey: "schoolId",
    sourceKey: "id",
  });
  School.hasMany(User, {
    foreignKey: "schoolId",
    sourceKey: "id",
    as: "users",
  });
  School.hasMany(Invite, {
    foreignKey: "schoolId",
    sourceKey: "id",
    as: "invites",
  });
  School.hasMany(Event, {
    foreignKey: "schoolId",
    sourceKey: "id",
    as: "events",
  });
  School.hasMany(ClassSchedule, {
    foreignKey: "schoolId",
    sourceKey: "id",
    as: "schoolSchedules",
  });
  School.hasMany(Complaint, {
    foreignKey: "schoolId",
    sourceKey: "id",
    as: "complaints",
  });
  School.hasMany(Role, {
    foreignKey: "schoolId",
    sourceKey: "id",
    as: "role",
  });
  School.hasMany(ExamSchedule, {
    foreignKey: "schoolId",
    sourceKey: "id",
    as: "examSchedules",
  });
  School.hasMany(Experience, {
    foreignKey: "schoolId",
    sourceKey: "id",
    as: "experiences",
  });
  School.hasMany(NoticeBoard, {
    foreignKey: "schoolId",
    sourceKey: "id",
    as: "notices",
  });
  School.hasMany(Assignment, {
    foreignKey: "schoolId",
    sourceKey: "id",
    as: "assignments",
  });
  //************/

  StudentAssignment.belongsTo(Assignment, {
    foreignKey: "assignmentId",
    targetKey: "id",
  });
  StudentAssignment.belongsTo(User, {
    foreignKey: "studentId",
    targetKey: "id",
  });
  //**************/

  Subject.belongsTo(School, { foreignKey: "schoolId", targetKey: "id" });
  Subject.hasMany(ClassSchedule, { foreignKey: "subjectId", sourceKey: "id" });
  Subject.hasMany(ExamSchedule, { foreignKey: "subjectId", sourceKey: "id" });
  Subject.hasMany(Assignment, { foreignKey: "subjectId", sourceKey: "id" });
  Subject.hasMany(Result, {
    foreignKey: "subjectId",
    sourceKey: "id",
    as: "results",
  });
  //**********/

  User.belongsTo(School, {
    foreignKey: "schoolId",
    targetKey: "id",
    onDelete: "CASCADE",
  });
  User.belongsTo(Role, { as: "role", foreignKey: "roleId", targetKey: "id" });
  User.belongsTo(Department, { foreignKey: "departmentId", targetKey: "id" });
  User.belongsToMany(Assignment, {
    through: "StudentAssignment",
    foreignKey: "studentId",
    otherKey: "assignmentId",
    as: "assignments",
  });
  User.belongsToMany(Class, {
    through: "ClassStudent",
    foreignKey: "studentId",
    otherKey: "classId",
  });
  User.hasMany(Assignment, {
    foreignKey: "teacherId",
    sourceKey: "id",
    as: "assignmentsCreated",
  });
  User.hasMany(RefreshToken, {
    foreignKey: "userId",
    sourceKey: "id",
    as: "refreshToken",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  }); // this ensure a user can login through multiple devices at same time
  User.hasMany(Permission, {
    foreignKey: "userId",
    sourceKey: "id",
    as: "permissionsReceived",
  });
  User.hasMany(Permission, {
    foreignKey: "setterId",
    sourceKey: "id",
    as: "permissionsSet",
  });
  User.hasMany(Attendance, {
    foreignKey: "userId",
    sourceKey: "id",
    as: "attendances",
  });
  User.hasMany(Attendance, {
    foreignKey: "markedById",
    sourceKey: "id",
    as: "markedAttendances",
  });
  User.hasMany(Invite, {
    foreignKey: "senderId",
    sourceKey: "id",
    as: "invitesSent",
  });
  User.hasMany(Invite, {
    foreignKey: "receiverId",
    sourceKey: "id",
    as: "invitesReceived",
  });
  User.hasMany(ClassSchedule, {
    foreignKey: "teacherId",
    sourceKey: "id",
    as: "teacher",
  });
  User.hasMany(Complaint, {
    foreignKey: "userId",
    sourceKey: "id",
    as: "complaints",
  });
  User.hasMany(Education, {
    foreignKey: "userId",
    sourceKey: "id",
    as: "degrees",
  });
  User.hasMany(Experience, {
    foreignKey: "userId",
    sourceKey: "id",
    as: "experiences",
  });
  User.hasMany(ExamSchedule, {
    foreignKey: "invigilatorId",
    sourceKey: "id",
    as: "invigilatedExams",
  });
  User.hasMany(NoticeBoard, {
    foreignKey: "userId",
    sourceKey: "id",
    as: "notices",
  });
  User.hasMany(Result, {
    foreignKey: "studentId",
    sourceKey: "id",
    as: "results",
  });
  User.hasMany(Result, {
    foreignKey: "teacherId",
    sourceKey: "id",
    as: "resultsGiven",
  });
};
