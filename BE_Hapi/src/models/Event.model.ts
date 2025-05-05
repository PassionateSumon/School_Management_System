export default (sequelize: any, DataType: any) => {
  const Event = sequelize.define(
    "Event",
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
      date: {
        type: DataType.DATEONLY,
        allowNull: false,
      },
      link: {
        type: DataType.STRING(500),
        allowNull: false,
      },
      startTime: {
        type: DataType.TIME,
        allowNull: false,
      },
      classId: {
        type: DataType.UUID,
        allowNull: true,
      },
      schoolId: {
        type: DataType.UUID,
        allowNull: false,
      },
      departmentId: {
        type: DataType.UUID,
        allowNull: true,
      },
      scope: {
        type: DataType.ENUM("school", "class", "department"),
        allowNull: false,
        defaultValue: "class",
      },
    },
    { tableName: "Event", timestamps: true }
  );
  return Event;
};
