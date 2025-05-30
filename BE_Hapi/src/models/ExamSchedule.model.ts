export default (sequelize: any, DataType: any) => {
  const ExamSchedule = sequelize.define(
    "ExamSchedule",
    {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
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
      invigilatorId: {
        type: DataType.UUID,
        allowNull: true,
      },
      subjectId: {
        type: DataType.UUID,
        allowNull: false,
      },
      date: {
        type: DataType.DATE,
        allowNull: false,
      },
      type: {
        type: DataType.ENUM("Midterm", "Final", "Quiz", "Practical", "Other"),
        allowNull: false,
        defaultValue: "Other",
      },
      startTime: {
        type: DataType.TIME,
        allowNull: false,
      },
      endTime: {
        type: DataType.TIME,
        allowNull: false,
        validate: {
          isValid(value: any) {
            if ((this as any).startTime > value) {
              throw new Error("End time must be greater than start time.");
            }
          },
        },
      },
      roomNo: {
        type: DataType.STRING,
        allowNull: false,
      },
    },
    { tableName: "ExamSchedule", timestamps: true }
  );
  return ExamSchedule;
};
