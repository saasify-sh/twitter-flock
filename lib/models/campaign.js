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
  model.getById = async function(id) {
    return model.findOne({
      where: { id }
    })
  }
  return model
}