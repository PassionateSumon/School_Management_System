export default (sequelize: any, DataType: any) => {
  const GradingScale = sequelize.define(
    "GradingScale",
    {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
      },
      schoolId: {
        type: DataType.UUID,
        allowNull: false,
      },
      name: {
        type: DataType.STRING,
        allowNull: false,
      },
      scale: {
        type: DataType.JSON,
        allowNull: false, // e.g., { "A": [90, 100], "B": [80, 89] }
      },
      isActive: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    { tableName: "GradingScale", timestamps: true }
  );
  return GradingScale;
};
