const { Sequelize, DataTypes } = require('sequelize')
const tildify = require('tildify')
const logger = require('./logger')
const campaign = require('./models/campaign')
let location
let sequelize
let User

exports.open = async (_location, dropTables = false) => {
  location = _location
  logger.debug(`opening database ${tildify(location)}`)

  sequelize = new Sequelize({ dialect: 'sqlite', storage: location })

  // register models
  User = require('./models/user')(sequelize, DataTypes)
  Campaign = require('./models/campaign')(sequelize, DataTypes)
  CampaignItem = require('./models/campaign_item')(sequelize, DataTypes)

  try {
    await sequelize.authenticate()
    logger.debug(`connected to database ${tildify(location)}`)
    await sequelize.sync({ force: dropTables }) // creates the table if it doesn't exist (and does nothing if it already exists). To overwrite, cf https://sequelize.org/master/manual/model-basics.html
    logger.debug('All DB models were synchronized successfully.')
  } catch (error) {
    throw `Unable to connect to the database: ${error}`
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
  return User.build(user)
}

// TEST
// ;(async function() {
//   await exports.open('flockdb-test.sqlite', true)
//   const jane = User.build({
//     screen_name: 'Jane',
//     id: 1001,
//     location: 'ES',
//     json: { screen_name: 'Jane', etc: 'other data' }
//   })
//   await jane.save()

//   const user = exports.createDAOUser({
//     id: 16395664,
//     id_str: '16395664',
//     name: 'masks4all Justin',
//     screen_name: 'justinlai',
//     location: 'Honolulu, HI',
//     description:
//       'Matthew 4:17 Views are my own, RTs/Likes/Follows are not endorsements.',
//     url: null,
//     entities: {
//       description: {
//         urls: []
//       }
//     },
//     protected: true,
//     followers_count: 132,
//     friends_count: 451,
//     listed_count: 6,
//     created_at: 'Sun Sep 21 21:56:35 +0000 2008',
//     favourites_count: 2602,
//     utc_offset: null,
//     time_zone: null,
//     geo_enabled: false,
//     verified: false,
//     statuses_count: 1695,
//     lang: null,
//     contributors_enabled: false,
//     is_translator: false,
//     is_translation_enabled: false,
//     profile_background_color: 'C0DEED',
//     profile_background_image_url:
//       'http://abs.twimg.com/images/themes/theme1/bg.png',
//     profile_background_image_url_https:
//       'https://abs.twimg.com/images/themes/theme1/bg.png',
//     profile_background_tile: false,
//     profile_image_url:
//       'http://pbs.twimg.com/profile_images/1244151220240973824/lvqYpLPZ_normal.jpg',
//     profile_image_url_https:
//       'https://pbs.twimg.com/profile_images/1244151220240973824/lvqYpLPZ_normal.jpg',
//     profile_banner_url:
//       'https://pbs.twimg.com/profile_banners/16395664/1589502930',
//     profile_link_color: '1DA1F2',
//     profile_sidebar_border_color: 'C0DEED',
//     profile_sidebar_fill_color: 'DDEEF6',
//     profile_text_color: '333333',
//     profile_use_background_image: true,
//     has_extended_profile: false,
//     default_profile: true,
//     default_profile_image: false,
//     following: false,
//     follow_request_sent: false,
//     notifications: false,
//     translator_type: 'none'
//   })
//   await user.save()

//   // check DAO helper functions
//   const assertResult = (result, expectedId) => {
//     const assert = require('assert')
//     console.log('result', JSON.stringify(result))
//     assert(result)
//     assert(result.id, expectedId)
//   }
//   assertResult(await User.getById(1001), 1001)
//   assertResult(await User.getByScreenName('Jane'), 1001)

//   await exports.close('')
// })()
