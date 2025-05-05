export default (sequelize: any, DataType: any) => {
  const Attendance = sequelize.define(
    "Attendance",
    {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
      },
      classScheduleId: {
        type: DataType.UUID,
        allowNull: false,
      },
      userId: {
        type: DataType.UUID,
        allowNull: false,
      },
      status: {
        type: DataType.ENUM("present", "absent", "late"),
        allowNull: false,
        defaultValue: "absent",
      },
      markedById: {
        type: DataType.UUID,
        allowNull: false,
      },
      markedAt: {
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
      },
    },
    { tableName: "Attendance", timestamps: true }
  );
  return Attendance;
};
