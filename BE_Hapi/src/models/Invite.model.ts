export default (sequelize: any, DataType: any) => {
  const Invite = sequelize.define(
    "Invite",
    {
      id: {
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
      },
      senderId: {
        type: DataType.UUID,
        allowNull: false,
      },
      receiverId: {
        type: DataType.UUID,
        allowNull: true,
      },
      schoolId: {
        type: DataType.UUID,
        allowNull: false,
      },
      roleId: {
        type: DataType.UUID,
        allowNull: false,
      },
      status: {
        type: DataType.ENUM("pending", "accepted", "rejected", "expired"),
        allowNull: false,
        defaultValue: "pending",
      },
      expiresAt: {
        type: DataType.DATE,
        allowNull: false,
        defaultValue: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      resendCount: {
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    { tableName: "Invite", timestamps: true }
  );
  return Invite;
};
