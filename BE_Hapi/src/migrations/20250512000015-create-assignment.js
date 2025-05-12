export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Assignment", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    dueDate: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    fileURL: {
      type: Sequelize.STRING,
      allowNull: false,
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
    subjectId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM("draft", "published"),
      allowNull: false,
      defaultValue: "draft",
    },
    maxPoints: {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 100,
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
  await queryInterface.dropTable("Assignment");
}