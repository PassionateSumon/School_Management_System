export default (sequelize: any, DataType: any) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataType.STRING,
        allowNull: false,
      },
      schoolId: {
        type: DataType.UUID,
        allowNull: false,
      },
      priority: {
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: {
            args: [1],
            msg: "Priority must be at least 1",
          },
          max: {
            args: [1000],
            msg: "Priority cannot exceed 1000",
          },
        },
      },
    },
    { tableName: "Role", timestamps: true }
  );
  return Role;
};
