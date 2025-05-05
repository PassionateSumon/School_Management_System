export default (sequelize: any, DataType: any) => {
  const Department = sequelize.define(
    "Department",
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
    },
    { tableName: "Department", timestamps: true }
  );
  return Department;
};
