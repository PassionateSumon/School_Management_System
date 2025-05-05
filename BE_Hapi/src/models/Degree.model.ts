export default (sequelize: any, DataType: any) => {
  const Degree = sequelize.define(
    "Degree",
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
    { tableName: "Degree", timestamps: true }
  );
  return Degree;
};
