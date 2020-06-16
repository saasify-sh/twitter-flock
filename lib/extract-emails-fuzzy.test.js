'use strict'

const test = require('ava')
const extractEmailsFuzzy = require('./extract-emails-fuzzy')
const isValidEmail = require('./is-valid-email')

const fixturesValid = [
  'foo at bar dot com',
  'foo AT bar DOT com',
  'foo @ bar . com',
  'foo  @   gmail  .   com',
  'e-mail us at hi at driftaway dot coffee',
  'email us at hi at driftaway dot coffee',
  'email us hi at driftaway dot coffee',
  'email hi at driftaway dot coffee',
  'email hi123 at driftaway dot coffee',
  'email us at AllHailtheClipKing at gmail'
  // I can be reached via email directly at bookishv (at) gmail.com or through the contact form below.
]

const fixturesInvalid = [
  'Light sleeper, heavy dreamer. Designing podcasts @Spotify. Previously @Headspace @Lyft @Google',
  'email us at hi at driftaway dot notavalidtld'
]

for (let i = 0; i < fixturesValid.length; ++i) {
  const fixture = fixturesValid[i]

  test(`extract-emails-fuzzy valid ${i}) ${fixture}`, (t) => {
    const emails = extractEmailsFuzzy(fixture)

    console.log({ fixture, emails })
    t.true(Array.isArray(emails))
    t.true(emails.length > 0)

    for (const email of emails) {
      t.true(isValidEmail(email))
    }

    t.snapshot(emails)
  })
}

for (let i = 0; i < fixturesInvalid.length; ++i) {
  const fixture = fixturesInvalid[i]

  test(`extract-emails-fuzzy invalid ${i}) ${fixture}`, (t) => {
    const emails = extractEmailsFuzzy(fixture)

    console.log({ fixture, emails })
    t.true(Array.isArray(emails))
    t.is(emails.length, 0)
  })
}
