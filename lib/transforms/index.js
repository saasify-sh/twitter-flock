'use strict'

const sortUsersByFuzzyPopularity = require('./sort-users-by-fuzzy-popularity')

const transformMap = {}

function registerBuiltinTransforms() {
  exports.registerTransform(
    'sort-users-by-fuzzy-popularity',
    sortUsersByFuzzyPopularity
  )
}

exports.registerTransform = (key, func) => {
  transformMap[key] = func
}

exports.getTransform = (key) => transformMap[key]
exports.getTransforms = () => Object.keys(transformMap)

registerBuiltinTransforms()
