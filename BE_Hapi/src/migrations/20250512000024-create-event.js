export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Event", {
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
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    link: {
      type: Sequelize.STRING(500),
      allowNull: false,
    },
    startTime: {
      type: Sequelize.TIME,
      allowNull: false,
    },
    classId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    schoolId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    departmentId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    scope: {
      type: Sequelize.ENUM("school", "class", "department"),
      allowNull: false,
      defaultValue: "class",
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
  await queryInterface.dropTable("Event");
}