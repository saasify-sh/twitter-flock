'use strict'

exports.getUnixTime = () => {
  return (Date.now() / 1000) | 0
}
