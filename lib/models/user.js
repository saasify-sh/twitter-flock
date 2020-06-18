'use strict'

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
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
  User.associate = function(models) {
    // associations can be defined here
  }
  User.getById = async function(id) {
    return User.findOne({
      where: { id }
    })
  }
  User.getByScreenName = async function(screen_name) {
    return User.findOne({
      where: {
        json: { screen_name }
      }
    })
  }
  return User
}
