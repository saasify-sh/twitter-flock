'use strict'

const camelcase = require('camelcase')
const { readdirSync } = require('fs')

readdirSync(__dirname)
  .filter((filename) => {
    return filename !== 'index.js' && /\.js$/.test(filename)
  })
  .forEach((filename) => {
    const name = camelcase(filename.split('.')[0])
    module.exports[name] = require(`./${filename}`)
  })
