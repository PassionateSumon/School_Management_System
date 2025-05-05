export default (sequelize: any, DataType: any) => {
  const ClassStudent = sequelize.define(
    "ClassStudent",
    {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
      },
      classId: {
        type: DataType.UUID,
        allowNull: false,
        references: {
          model: sequelize.models.Class,
          key: "id",
        },
      },
      studentId: {
        type: DataType.UUID,
        allowNull: false,
        references: {
          model: sequelize.models.User,
          key: "id",
        },
      },
    },
    { tableName: "ClassStudent", timestamps: true }
  );
  return ClassStudent;
};
