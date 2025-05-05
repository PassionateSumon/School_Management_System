export default (sequelize: any, DataType: any) => {
  const Experience = sequelize.define(
    "Experience",
    {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataType.UUID,
        allowNull: false,
      },
      company: {
        type: DataType.STRING,
        allowNull: false,
      },
      position: {
        type: DataType.STRING,
        allowNull: false,
      },
      startDate: {
        type: DataType.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: DataType.DATEONLY,
        allowNull: true,
      },
      certificate: {
        type: DataType.STRING,
        allowNull: true,
      },
    },
    { tableName: "Experience", timestamps: true }
  );
  return Experience;
};
