'use strict'
const db = require('./db-sqlite')
const location = 'flockdb-test.sqlite'
let models

beforeAll(async () => {
  // init once instead of per test; attempt to workaround https://github.com/mapbox/node-sqlite3/issues/1314 for Travis CI
  await db.open(location, true)
  models = db.models
})

afterAll(async () => {
  await db.close(location)
})

const createUser = (id) =>
  models.User.build({
    id,
    location: 'ES',
    json: { screen_name: 'Jane', etc: 'other data' }
  })

test('check User model', async (done) => {
  await createUser(1001).save()
  expect((await models.User.getById(1001)).id).toBe(1001)
  expect((await models.User.getByScreenName('Jane')).id).toBe(1001)
  done()
})

test('check User mapper', () => {
  const jsonTwitterUser = {
    id: 100000001,
    id_str: '100000001',
    name: 'Jack',
    screen_name: 'jack',
    location: 'Earth',
    description: 'bio here'
  }
  const daoUser = db.createDAOUser(jsonTwitterUser)

  expect(daoUser).toBeDefined()
  expect(daoUser.id).toBe(100000001)
  expect(daoUser.json.screen_name).toBe('jack')
})

test('check Campaign associations', async (done) => {
  await createUser(1002).save()

  const campaign1 = await models.Campaign.create({
    status: 'new',
    description: 'my campaign'
  })
  await models.CampaignItem.create({
    campaign_id: campaign1.id,
    user_id: 1002,
    user_status: 'contacted'
  })

  const campaign1Bis = await models.Campaign.getById(campaign1.id)
  expect(campaign1Bis.description).toBe('my campaign')

  const campaign1BisItems = await campaign1Bis.getCampaignItems() // lazy loaded
  expect(campaign1BisItems.length).toBe(1)
  expect(campaign1BisItems[0]).toMatchObject({
    campaign_id: 1,
    user_status: 'contacted'
  })
  done()
})
