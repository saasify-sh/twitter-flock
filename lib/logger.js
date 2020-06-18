'use strict'

const consola = require('consola')

module.exports = consola.create({
  level: process.env.LOG_LEVEL || 2
})
