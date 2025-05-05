export default (sequelize: any, DataType: any) => {
  const Assignment = sequelize.define(
    "Assignment",
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
      description: {
        type: DataType.TEXT,
        allowNull: true,
      },
      dueDate: {
        type: DataType.DATE,
        allowNull: false,
      },
      fileURL: {
        type: DataType.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [1, 500],
            msg: "File URL must be between 1 and 500 characters",
          },
          is: {
            args: [/^(https?:\/\/)/],
            msg: "File must be a valid URL",
          },
        },
      },
      teacherId: {
        type: DataType.UUID,
        allowNull: false,
      },
      classId: {
        type: DataType.UUID,
        allowNull: false,
      },
      schoolId: {
        type: DataType.UUID,
        allowNull: false,
      },
      subjectId: {
        type: DataType.UUID,
        allowNull: false,
      },
      status: {
        type: DataType.ENUM("draft", "published"),
        allowNull: false,
        defaultValue: "draft",
      },
      maxPoints: {
        type: DataType.FLOAT,
        allowNull: false,
        defaultValue: 100,
      },
    },
    { tableName: "Assignment", timestamps: true }
  );
  return Assignment;
};
