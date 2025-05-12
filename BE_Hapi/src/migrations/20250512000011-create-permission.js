export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Permission", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    setterId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    roleId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    moduleId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    targetType: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    targetId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    action: {
      type: Sequelize.ENUM("manage-all", "read", "write", "delete", "update"),
      allowNull: false,
    },
    scope: {
      type: Sequelize.ENUM("specific", "all"),
      allowNull: false,
      defaultValue: "specific",
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  }, {
    indexes: [
      { fields: ["userId"] },
      { fields: ["setterId"] },
      { fields: ["roleId"] },
      { fields: ["targetId"] },
      { fields: ["moduleId"] },
      { fields: ["targetType"] },
    ],
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Permission");
}