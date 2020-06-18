'use strict'

module.exports = (sequelize, DataTypes) => {
  const model = sequelize.define(
    'Campaign',
    {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
      },
      status: DataTypes.STRING, // 'new'->'running'->'paused'->'completed', etc
      description: DataTypes.STRING
    },
    {}
  )
  model.associate = function(models) {
    // associations can be defined here
  }
  return model
}
