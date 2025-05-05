export default (sequelize: any, DataType: any) => {
  const Complaint = sequelize.define(
    "Complaint",
    {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
      },
      subject: {
        type: DataType.STRING,
        allowNull: false,
      },
      description: {
        type: DataType.TEXT,
        allowNull: true,
      },
      userId: {
        type: DataType.UUID,
        allowNull: false,
      },
      schoolId: {
        type: DataType.UUID,
        allowNull: false,
      },
      classId: {
        type: DataType.UUID,
        allowNull: true,
      },
      status: {
        type: DataType.ENUM("pending", "attened", "resolved"),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    { tableName: "Complaint", timestamps: true }
  );
  return Complaint;
};
