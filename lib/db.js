'use strict'

const db_sqlite = require('./db-sqlite')
const exit = require('capture-exit')
const level = require('level')
const os = require('os')
const path = require('path')
const tildify = require('tildify')

const logger = require('./logger')

exit.captureExit()

const dbName = process.env.FLOCK_DB_NAME || 'flock'
const homeDir = os.homedir()
const tempDir = os.tmpdir()
const baseDir = homeDir || tempDir
const location = path.join(baseDir, homeDir ? `.${dbName}` : dbName)

logger.debug(`opening database ${tildify(location)}`)

module.exports = level(location, {
  valueEncoding: 'json'
})
;(async function() {
  await db_sqlite.open(`${location}.sqlite`)
})()

exit.onExit(async () => {
  await db_sqlite.close(location)
  logger.debug(`closing database ${tildify(location)}`)
  return module.exports.close()
})
