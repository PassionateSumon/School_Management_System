export default (sequelize: any, DataType: any) => {
  const Class = sequelize.define(
    "Class",
    {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataType.STRING,
        allowNull: false,
      },
      schoolId: {
        type: DataType.UUID,
        allowNull: false,
      },
      departmentId: {
        type: DataType.UUID,
        allowNull: true,
      },
    },
    { tableName: "Class", timestamps: true, indexes: [{ fields: ["name"] }] }
  );
  return Class;
};
