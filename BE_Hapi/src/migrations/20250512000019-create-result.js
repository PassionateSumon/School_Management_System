export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Result", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    classId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    teacherId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    schoolId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    assignmentId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    examScheduleId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    subjectId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    file: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    grade: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    maxPoints: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    obtainedPoints: {
      type: Sequelize.FLOAT,
      allowNull: true,
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
  await queryInterface.dropTable("Result");
}