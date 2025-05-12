export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("ClassStudent", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    classId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    studentId: {
      type: Sequelize.UUID,
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
  await queryInterface.dropTable("ClassStudent");
}