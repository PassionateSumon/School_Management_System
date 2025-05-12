export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("StudentAssignment", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    assignmentId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    hasSubmitted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    submittedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    submissionFileUrl: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    submissionText: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    editRequested: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    editApproved: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    editedAt: {
      type: Sequelize.DATE,
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
  await queryInterface.dropTable("StudentAssignment");
}