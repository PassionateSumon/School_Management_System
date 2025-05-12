export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Module", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    schoolId: {
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
  }, {
    indexes: [{ fields: ["name"] }],
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("Module");
}