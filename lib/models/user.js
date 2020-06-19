'use strict'

module.exports = (sequelize, DataTypes) => {
  const model = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
        primaryKey: true
      },
      json: DataTypes.JSON // The https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/user-object
    },
    {}
  )
  model.getById = async function(id) {
    return model.findOne({
      where: { id }
    })
  }
  model.getByScreenName = async function(screenName) {
    return model.findOne({
      where: {
        json: { screen_name: screenName }
      }
    })
  }
  return model
}
