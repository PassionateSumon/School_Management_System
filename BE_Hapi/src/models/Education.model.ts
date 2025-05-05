
export default (sequelize: any, DataType: any) => {
  const Education = sequelize.define(
    "Education",
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
      institute: {
        type: DataType.STRING,
        allowNull: false,
      },
      startDate: {
        type: DataType.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataType.DATE,
        allowNull: true,
      },
      certificate: {
        type: DataType.STRING,
        allowNull: true,
      },
      userId: {
        type: DataType.UUID,
        allowNull: false,
      },
    },
    { tableName: "Education", timestamps: true }
  );
  return Education;
};
