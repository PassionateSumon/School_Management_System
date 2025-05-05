export default (sequelize: any, DataType: any) => {
  // console.log("schoool --> ", sequelize);
  const School = sequelize.define(
    "School",
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
      address: {
        type: DataType.TEXT,
        allowNull: true,
      },
      contactEmail: {
        type: DataType.STRING,
        allowNull: true,
      },
      gradeScaleId: {
        type: DataType.UUID,
        allowNull: true,
      },
      isActive: {
        type: DataType.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "School",
      timestamps: true,
    }
  );
  return School;
};
