'use strict'

const linkify = require('linkifyjs')

module.exports = function extractEmails(text = '') {
  return linkify
    .find(text)
    .map((link) => (link.type === 'email' ? link.value : null))
    .filter(Boolean)
}
