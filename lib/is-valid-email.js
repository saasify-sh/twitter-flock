'use strict'

const emailValidator = require('email-validator')

module.exports = function isValidEmail(value) {
  return value && emailValidator.validate(value)
}
