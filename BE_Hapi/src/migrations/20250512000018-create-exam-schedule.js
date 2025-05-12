export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("ExamSchedule", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    teacherId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    classId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    schoolId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    invigilatorId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    subjectId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    date: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    type: {
      type: Sequelize.ENUM("Midterm", "Final", "Quiz", "Practical", "Other"),
      allowNull: false,
      defaultValue: "Other",
    },
    startTime: {
      type: Sequelize.TIME,
      allowNull: false,
    },
    endTime: {
      type: Sequelize.TIME,
      allowNull: false,
    },
    roomNo: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("ExamSchedule");
}