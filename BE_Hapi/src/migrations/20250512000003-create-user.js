export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("User", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    tempPassword: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    address: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    specialization: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    rollNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    parentEmail: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    profilePicture: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    gender: {
      type: Sequelize.ENUM("male", "female", "other"),
      allowNull: true,
    },
    dateOfBirth: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    isTempPassword: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    system_defined: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    schoolId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    roleId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    departmentId: {
      type: Sequelize.UUID,
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
  await queryInterface.dropTable("User");
}