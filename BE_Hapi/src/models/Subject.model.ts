export default (sequelize: any, DataType: any) => {
  const Subject = sequelize.define(
    "Subject",
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
      code: {
        type: DataType.STRING,
        allowNull: true,
        unique: true,
      },
      schoolId: {
        type: DataType.UUID,
        allowNull: false,
      },
    },
    { tableName: "Subject", timestamps: true }
  );
  return Subject;
};
