export default (sequelize: any, DataType: any) => {
  const StudentAssignment = sequelize.define(
    "StudentAssignment",
    {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
      },
      studentId: {
        type: DataType.UUID,
        allowNull: false,
      },
      assignmentId: {
        type: DataType.UUID,
        allowNull: false,
      },
      hasSubmitted: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      submittedAt: {
        type: DataType.DATE,
        allowNull: true,
      },
      submissionFileUrl: {
        type: DataType.STRING,
        allowNull: true,
      },
      submissionText: {
        // if there is anything to tell while submitting the assignment
        type: DataType.TEXT,
        allowNull: true,
      },
      editRequested: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      editApproved: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      editedAt: {
        type: DataType.DATE,
        allowNull: true,
      },
    },
    { tableName: "StudentAssignment", timestamps: true }
  );
  return StudentAssignment;
};
