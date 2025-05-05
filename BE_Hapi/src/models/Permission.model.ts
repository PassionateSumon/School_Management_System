export default (sequelize: any, DataType: any) => {
  const Permission = sequelize.define(
    "Permission",
    {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataType.UUID,
        allowNull: true,
      },
      setterId: {
        type: DataType.UUID,
        allowNull: false,
      },
      roleId: {
        type: DataType.UUID,
        allowNull: true,
      },
      moduleId: {
        type: DataType.UUID,
        allowNull: false,
      },
      targetType: {
        type: DataType.STRING(100), // Dynamic, e.g., "school", "class-9", "class-10"
        allowNull: false,
        validate: {
          len: [1, 100],
        },
      },
      targetId: {
        // ID of the resource (like classId, schoolId)
        type: DataType.UUID,
        allowNull: true,
      },
      action: {
        type: DataType.ENUM("manage-all", "read", "write", "delete", "update"),
        allowNull: false,
      },
      scope: {
        type: DataType.ENUM("specific", "all"),
        allowNull: false,
        defaultValue: "specific",
      },
    },
    {
      tableName: "Permission",
      timestamps: true,
      indexes: [
        { fields: ["userId"] },
        { fields: ["setterId"] },
        { fields: ["roleId"] },
        { fields: ["targetId"] },
        { fields: ["moduleId"] },
        { fields: ["targetType"] },
      ],
    }
  );
  return Permission;
};
