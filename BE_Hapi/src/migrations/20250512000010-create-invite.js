export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("Invite", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    senderId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    receiverId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    schoolId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    roleId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM("pending", "accepted", "rejected", "expired"),
      allowNull: false,
      defaultValue: "pending",
    },
    expiresAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    resendCount: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
  await queryInterface.dropTable("Invite");
}