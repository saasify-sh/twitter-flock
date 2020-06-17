'use strict'

const config = require('./config')

const keyUser = 'user'

exports.isAuthenticated = () => {
  return config.has(keyUser)
}

exports.assertIsAuthenticated = () => {
  if (!exports.isAuthenticated()) {
    throw new Error('Please login first')
  }
}

exports.get = () => {
  if (exports.isAuthenticated()) {
    return {
      user: config.get(keyUser)
    }
  } else {
    return {}
  }
}

exports.signin = ({ user }) => {
  config.set(keyUser, user)
}

exports.signout = () => {
  config.delete(keyUser)
}
