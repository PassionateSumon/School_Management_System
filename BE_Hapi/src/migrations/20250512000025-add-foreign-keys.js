export async function up(queryInterface, Sequelize) {
  // Assignment
  await queryInterface.addConstraint("Assignment", {
    fields: ["subjectId"],
    type: "foreign key",
    references: { table: "Subject", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Assignment", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Assignment", {
    fields: ["classId"],
    type: "foreign key",
    references: { table: "Class", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Assignment", {
    fields: ["teacherId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });

  // Attendance
  await queryInterface.addConstraint("Attendance", {
    fields: ["classScheduleId"],
    type: "foreign key",
    references: { table: "ClassSchedule", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Attendance", {
    fields: ["userId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Attendance", {
    fields: ["markedById"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });

  // Class
  await queryInterface.addConstraint("Class", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Class", {
    fields: ["departmentId"],
    type: "foreign key",
    references: { table: "Department", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  // ClassSchedule
  await queryInterface.addConstraint("ClassSchedule", {
    fields: ["classId"],
    type: "foreign key",
    references: { table: "Class", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("ClassSchedule", {
    fields: ["teacherId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("ClassSchedule", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("ClassSchedule", {
    fields: ["subjectId"],
    type: "foreign key",
    references: { table: "Subject", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });

  // ClassStudent
  await queryInterface.addConstraint("ClassStudent", {
    fields: ["classId"],
    type: "foreign key",
    references: { table: "Class", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("ClassStudent", {
    fields: ["studentId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Complaint
  await queryInterface.addConstraint("Complaint", {
    fields: ["userId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Complaint", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Complaint", {
    fields: ["classId"],
    type: "foreign key",
    references: { table: "Class", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  // Degree
  await queryInterface.addConstraint("Degree", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Department
  await queryInterface.addConstraint("Department", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Education
  await queryInterface.addConstraint("Education", {
    fields: ["userId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Event
  await queryInterface.addConstraint("Event", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Event", {
    fields: ["classId"],
    type: "foreign key",
    references: { table: "Class", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Event", {
    fields: ["departmentId"],
    type: "foreign key",
    references: { table: "Department", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  // ExamSchedule
  await queryInterface.addConstraint("ExamSchedule", {
    fields: ["classId"],
    type: "foreign key",
    references: { table: "Class", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("ExamSchedule", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("ExamSchedule", {
    fields: ["invigilatorId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("ExamSchedule", {
    fields: ["subjectId"],
    type: "foreign key",
    references: { table: "Subject", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("ExamSchedule", {
    fields: ["teacherId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });

  // Experience
  await queryInterface.addConstraint("Experience", {
    fields: ["userId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // GradingScale
  await queryInterface.addConstraint("GradingScale", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Invite
  await queryInterface.addConstraint("Invite", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Invite", {
    fields: ["senderId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Invite", {
    fields: ["receiverId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Invite", {
    fields: ["roleId"],
    type: "foreign key",
    references: { table: "Role", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });

  // Module
  await queryInterface.addConstraint("Module", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // NoticeBoard
  await queryInterface.addConstraint("NoticeBoard", {
    fields: ["userId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("NoticeBoard", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("NoticeBoard", {
    fields: ["classId"],
    type: "foreign key",
    references: { table: "Class", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("NoticeBoard", {
    fields: ["departmentId"],
    type: "foreign key",
    references: { table: "Department", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  // Permission
  await queryInterface.addConstraint("Permission", {
    fields: ["roleId"],
    type: "foreign key",
    references: { table: "Role", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Permission", {
    fields: ["userId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Permission", {
    fields: ["setterId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Permission", {
    fields: ["moduleId"],
    type: "foreign key",
    references: { table: "Module", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // RefreshToken
  await queryInterface.addConstraint("RefreshToken", {
    fields: ["userId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Result
  await queryInterface.addConstraint("Result", {
    fields: ["studentId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Result", {
    fields: ["teacherId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Result", {
    fields: ["classId"],
    type: "foreign key",
    references: { table: "Class", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Result", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Result", {
    fields: ["assignmentId"],
    type: "foreign key",
    references: { table: "Assignment", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Result", {
    fields: ["examScheduleId"],
    type: "foreign key",
    references: { table: "ExamSchedule", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("Result", {
    fields: ["subjectId"],
    type: "foreign key",
    references: { table: "Subject", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  // School
  await queryInterface.addConstraint("School", {
    fields: ["gradeScaleId"],
    type: "foreign key",
    references: { table: "GradingScale", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  // StudentAssignment
  await queryInterface.addConstraint("StudentAssignment", {
    fields: ["assignmentId"],
    type: "foreign key",
    references: { table: "Assignment", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("StudentAssignment", {
    fields: ["studentId"],
    type: "foreign key",
    references: { table: "User", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // Subject
  await queryInterface.addConstraint("Subject", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  // User
  await queryInterface.addConstraint("User", {
    fields: ["schoolId"],
    type: "foreign key",
    references: { table: "School", field: "id" },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("User", {
    fields: ["roleId"],
    type: "foreign key",
    references: { table: "Role", field: "id" },
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  await queryInterface.addConstraint("User", {
    fields: ["departmentId"],
    type: "foreign key",
    references: { table: "Department", field: "id" },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });
}

export async function down(queryInterface) {
  // Remove foreign key constraints in reverse order
  await queryInterface.removeConstraint("User", "User_departmentId_fkey");
  await queryInterface.removeConstraint("User", "User_roleId_fkey");
  await queryInterface.removeConstraint("User", "User_schoolId_fkey");
  await queryInterface.removeConstraint("Subject", "Subject_schoolId_fkey");
  await queryInterface.removeConstraint(
    "StudentAssignment",
    "StudentAssignment_studentId_fkey"
  );
  await queryInterface.removeConstraint(
    "StudentAssignment",
    "StudentAssignment_assignmentId_fkey"
  );
  await queryInterface.removeConstraint("School", "School_gradeScaleId_fkey");
  await queryInterface.removeConstraint("Result", "Result_subjectId_fkey");
  await queryInterface.removeConstraint("Result", "Result_examScheduleId_fkey");
  await queryInterface.removeConstraint("Result", "Result_assignmentId_fkey");
  await queryInterface.removeConstraint("Result", "Result_schoolId_fkey");
  await queryInterface.removeConstraint("Result", "Result_classId_fkey");
  await queryInterface.removeConstraint("Result", "Result_teacherId_fkey");
  await queryInterface.removeConstraint("Result", "Result_studentId_fkey");
  await queryInterface.removeConstraint(
    "RefreshToken",
    "RefreshToken_userId_fkey"
  );
  await queryInterface.removeConstraint(
    "Permission",
    "Permission_moduleId_fkey"
  );
  await queryInterface.removeConstraint(
    "Permission",
    "Permission_setterId_fkey"
  );
  await queryInterface.removeConstraint("Permission", "Permission_userId_fkey");
  await queryInterface.removeConstraint("Permission", "Permission_roleId_fkey");
  await queryInterface.removeConstraint(
    "NoticeBoard",
    "NoticeBoard_departmentId_fkey"
  );
  await queryInterface.removeConstraint(
    "NoticeBoard",
    "NoticeBoard_classId_fkey"
  );
  await queryInterface.removeConstraint(
    "NoticeBoard",
    "NoticeBoard_schoolId_fkey"
  );
  await queryInterface.removeConstraint(
    "NoticeBoard",
    "NoticeBoard_userId_fkey"
  );
  await queryInterface.removeConstraint("Module", "Module_schoolId_fkey");
  await queryInterface.removeConstraint("Invite", "Invite_roleId_fkey");
  await queryInterface.removeConstraint("Invite", "Invite_receiverId_fkey");
  await queryInterface.removeConstraint("Invite", "Invite_senderId_fkey");
  await queryInterface.removeConstraint("Invite", "Invite_schoolId_fkey");
  await queryInterface.removeConstraint(
    "GradingScale",
    "GradingScale_schoolId_fkey"
  );
  await queryInterface.removeConstraint("Experience", "Experience_userId_fkey");
  await queryInterface.removeConstraint(
    "ExamSchedule",
    "ExamSchedule_teacherId_fkey"
  );
  await queryInterface.removeConstraint(
    "ExamSchedule",
    "ExamSchedule_subjectId_fkey"
  );
  await queryInterface.removeConstraint(
    "ExamSchedule",
    "ExamSchedule_invigilatorId_fkey"
  );
  await queryInterface.removeConstraint(
    "ExamSchedule",
    "ExamSchedule_schoolId_fkey"
  );
  await queryInterface.removeConstraint(
    "ExamSchedule",
    "ExamSchedule_classId_fkey"
  );
  await queryInterface.removeConstraint("Event", "Event_departmentId_fkey");
  await queryInterface.removeConstraint("Event", "Event_classId_fkey");
  await queryInterface.removeConstraint("Event", "Event_schoolId_fkey");
  await queryInterface.removeConstraint("Education", "Education_userId_fkey");
  await queryInterface.removeConstraint(
    "Department",
    "Department_schoolId_fkey"
  );
  await queryInterface.removeConstraint("Degree", "Degree_schoolId_fkey");
  await queryInterface.removeConstraint("Complaint", "Complaint_classId_fkey");
  await queryInterface.removeConstraint("Complaint", "Complaint_schoolId_fkey");
  await queryInterface.removeConstraint("Complaint", "Complaint_userId_fkey");
  await queryInterface.removeConstraint(
    "ClassStudent",
    "ClassStudent_studentId_fkey"
  );
  await queryInterface.removeConstraint(
    "ClassStudent",
    "ClassStudent_classId_fkey"
  );
  await queryInterface.removeConstraint(
    "ClassSchedule",
    "ClassSchedule_subjectId_fkey"
  );
  await queryInterface.removeConstraint(
    "ClassSchedule",
    "ClassSchedule_schoolId_fkey"
  );
  await queryInterface.removeConstraint(
    "ClassSchedule",
    "ClassSchedule_teacherId_fkey"
  );
  await queryInterface.removeConstraint(
    "ClassSchedule",
    "ClassSchedule_classId_fkey"
  );
  await queryInterface.removeConstraint("Class", "Class_departmentId_fkey");
  await queryInterface.removeConstraint("Class", "Class_schoolId_fkey");
  await queryInterface.removeConstraint(
    "Attendance",
    "Attendance_markedById_fkey"
  );
  await queryInterface.removeConstraint("Attendance", "Attendance_userId_fkey");
  await queryInterface.removeConstraint(
    "Attendance",
    "Attendance_classScheduleId_fkey"
  );
  await queryInterface.removeConstraint(
    "Assignment",
    "Assignment_teacherId_fkey"
  );
  await queryInterface.removeConstraint(
    "Assignment",
    "Assignment_classId_fkey"
  );
  await queryInterface.removeConstraint(
    "Assignment",
    "Assignment_schoolId_fkey"
  );
  await queryInterface.removeConstraint(
    "Assignment",
    "Assignment_subjectId_fkey"
  );
}
