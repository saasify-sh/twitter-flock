'use strict'

const stableDedupe = require('./stable-dedupe')
const tlds = require('./tlds')

const patterns = [
  {
    regex: /e-?mail\s+(?:me|us)\s+(?:at)?\s*([a-zA-Z0-9-_]+)\s*(?:at|@)\s+([a-zA-Z0-9-_]+)\s*(?:dot|\.)\s*([a-zA-Z]+)\b/i,
    extract: (match) =>
      tlds.has(match[3]) && `${match[1]}@${match[2]}.${match[3]}`
  },
  {
    regex: /e-?mail\s+([a-zA-Z0-9-_]+)\s*(?:at|@)\s+([a-zA-Z0-9-_]+)\s*(?:dot|\.)\s*([a-zA-Z]+)\b/i,
    extract: (match) =>
      tlds.has(match[3]) && `${match[1]}@${match[2]}.${match[3]}`
  },
  {
    regex: /\b([a-zA-Z0-9-_]+)\s*(?:at|@)\s+([a-zA-Z0-9-_]+)\s*(?:dot|\.)\s*(com|org|net|sh|io|de|dev|icu|uk|jp|ru|info|top|xyz)\b/i,
    extract: (match) => `${match[1]}@${match[2]}.${match[3]}`
  },
  {
    regex: /\b([a-zA-Z0-9-_]+)\s*(?:at|@)\s+(gmail|yahoo|hotmail|aol|icloud)\b/i,
    extract: (match) => `${match[1]}@${match[2]}.com`
  }
]

module.exports = function extractEmailsFuzzy(text = '') {
  const emails = []

  for (const pattern of patterns) {
    const match = text.match(pattern.regex)

    if (match) {
      const email = (pattern.extract(match) || '').trim()

      if (email) {
        emails.push(email)
      }
    }
  }

  return stableDedupe(emails)
}
