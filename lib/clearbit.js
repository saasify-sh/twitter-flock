'use strict'

const random = require('random')
const pThrottle = require('p-throttle')
const Clearbit = require('clearbit').Client

const apiKeys = (process.env.CLEARBIT_API_KEYS || '')
  .split(',')
  .map((key) => key.trim())
  .filter(Boolean)

let _apiKey = null
let _client = null

exports.getClient = () => {
  if (!_client && apiKeys.length) {
    const apiKeyIndex = random.int(0, apiKeys.length - 1)
    const apiKey = apiKeys[apiKeyIndex]

    apiKeys.splice(apiKeyIndex, 1)

    _apiKey = apiKey
    _client = new Clearbit({ key: apiKey })
  }

  return _client
}

exports.cycleClient = () => {
  if (_client) {
    console.error('cycling api key', _apiKey)
    _apiKey = null
    _client = null
  }
}

// clearbit enforces a rate limit of 600 requests per minute
// (which is the same as 6 per second)
exports.getProspectorSearch = pThrottle(_getProspectorSearch, 6, 1000)

async function _getProspectorSearch(opts) {
  while (true) {
    try {
      const client = exports.getClient()
      if (!client) {
        throw new Error('no valid clearbit api key')
      }

      const res = await client.Prospector.search(opts)
      return res
    } catch (err) {
      if (err.statusCode === 402) {
        console.error(err.message, _apiKey)
        exports.cycleClient()
      } else {
        throw err
      }
    }
  }
}
