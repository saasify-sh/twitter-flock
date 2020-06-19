'use strict'

const { Sequelize, DataTypes } = require('sequelize')
const tildify = require('tildify')
const logger = require('./logger')
let location
let sequelize
const models = {}

exports.models = models
exports.open = async (_location, dropTables = false) => {
  location = _location
  logger.debug(`opening database ${tildify(location)}`)

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: location,
    logging: (queryString, queryObject) => {
      logger.debug(
        'sqlite',
        queryString,
        queryObject.bind ? queryObject.bind : ''
      ) // log the parameterized/bind part of the query explicitly
    }
  })

  // register models
  models.User = require('./models/user')(sequelize, DataTypes)
  models.Campaign = require('./models/campaign')(sequelize, DataTypes)
  models.CampaignItem = require('./models/campaign_item')(sequelize, DataTypes)
  // associations
  models.CampaignItem.belongsTo(models.User, {
    foreignKey: 'user_id',
    onDelete: 'NO ACTION ',
    onUpdate: 'NO ACTION '
  })
  models.CampaignItem.belongsTo(models.Campaign, {
    // https://sequelize.readthedocs.io/en/latest/api/associations/index.html?highlight=onDelete#belongstotarget-options
    foreignKey: 'campaign_id',
    onDelete: 'NO ACTION ',
    onUpdate: 'NO ACTION '
  })
  models.Campaign.hasMany(models.CampaignItem, {
    // https://sequelize.readthedocs.io/en/latest/api/associations/index.html?highlight=onDelete#hasmanytarget-options
    foreignKey: 'campaign_id',
    onDelete: 'NO ACTION ',
    onUpdate: 'NO ACTION '
  })

  try {
    await sequelize.authenticate()
    logger.debug(`connected to database ${tildify(location)}`)
    await sequelize.sync({ force: dropTables }) // creates the table if it doesn't exist (and does nothing if it already exists). To overwrite, cf https://sequelize.org/master/manual/model-basics.html
    logger.debug('All DB models were synchronized successfully.')
  } catch (error) {
    logger.error(`Unable to connect to the database: ${error}`)
    throw error
  }
}

exports.close = async () => {
  logger.debug(`closing database ${tildify(location)}`)
  await sequelize.close()
}

/**
 * Object mapper, from twitter user object to DAO User model
 * @param {Object} twitterUserObject a twitter user objected, as defined in https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/user-object
 */
exports.createDAOUser = (twitterUserObject) => {
  const user = {
    id: twitterUserObject.id,
    screen_name: twitterUserObject.screen_name,
    location: twitterUserObject.location,
    json: twitterUserObject
  }
  return models.User.build(user)
}
