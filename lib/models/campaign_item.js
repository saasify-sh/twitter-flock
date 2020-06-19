'use strict'

// 1 campaign has many CampaignItem items. Each CampaignItem references an user that is part of this campaign.
// The user status reflects whether the user was already contacted or not
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'CampaignItem',
    {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
      },
      campaign_id: DataTypes.BIGINT,
      user_id: DataTypes.BIGINT,
      user_status: DataTypes.STRING // '' (to process), 'contacted' (reached out via DM/tweet/etc)
    },
    {}
  )
}
