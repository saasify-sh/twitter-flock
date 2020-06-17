'use strict'

const level = require('level')

const os = require('os')
const path = require('path')

const dbName = process.env.FLOCK_DB_NAME || 'flock'
const homeDir = os.homedir()
const tempDir = os.tmpdir()
const baseDir = homeDir || tempDir
const location = path.join(baseDir, homeDir ? `.${dbName}` : dbName)

// defaults to ~/.flock
module.exports = level(location)
