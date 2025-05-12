export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("NoticeBoard", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    notice: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    schoolId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    classId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    departmentId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM("Draft", "Published", "Completed"),
      allowNull: false,
      defaultValue: "Draft",
    },
    publishedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    file: {
      type: Sequelize.STRING,
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
  await queryInterface.dropTable("NoticeBoard");
}