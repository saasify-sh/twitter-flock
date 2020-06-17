#!/usr/bin/env node
'use strict'

require('dotenv').config()

const fs = require('fs')
const didYouMean = require('didyoumean')
const updateNotifier = require('update-notifier')
const program = require('commander')

const pkg = require('../package')
const auth = require('./auth')
const db = require('./db')
const commands = require('./commands')
const logger = require('./logger')

function suggestCommands(cmd) {
  const availableCommands = program.commands.map((cmd) => cmd._name)
  const suggestion = didYouMean(cmd, availableCommands)
  if (suggestion) {
    logger.error(`\nDid you mean ${suggestion}?`)
  }
}

module.exports = async (argv) => {
  updateNotifier({ pkg }).notify()

  // TODO: initialize twitter client here
  const context = {
    auth,
    db
  }

  program
    .name('flock')
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-v, --verbose', 'Enable verbose logging', false)
    .option(
      '-o, --output <file>',
      'Write logging output to the given file (defaults to stdout)'
    )

  for (const command of commands) {
    await Promise.resolve(command(program, context))
  }

  program.command('*', null, { noHelp: true }).action((cmd) => {
    logger.error(`Invalid command: "${cmd}"`)
    logger.error()
    program.outputHelp()
    suggestCommands(cmd)
    process.exit(1)
  })

  program.requireAuthentication = () => {
    if (!auth.isAuthenticated()) {
      logger.error('Command requires authentication. Please login first.')
      process.exit(1)
    }
  }

  program.appendOutput = (content) => {
    if (program.output) {
      fs.appendFileSync(program.output, content)
    } else {
      logger.log(content)
    }
  }

  program.writeOutput = (content) => {
    if (program.output) {
      fs.writeFileSync(program.output, content)
    } else {
      logger.log(content)
    }
  }

  program.parse(argv)

  if (program.verbose) {
    logger.level = 4
  }
}

if (!module.parent) {
  module.exports(process.argv)
}
