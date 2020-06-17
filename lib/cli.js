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

function suggestCommands(cmd) {
  const availableCommands = program.commands.map((cmd) => cmd._name)
  const suggestion = didYouMean(cmd, availableCommands)
  if (suggestion) {
    console.error(`\nDid you mean ${suggestion}?`)
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
    console.error(`Invalid command: "${cmd}"`)
    console.error()
    program.outputHelp()
    suggestCommands(cmd)
    process.exit(1)
  })

  program.requireAuthentication = () => {
    if (!auth.isAuthenticated()) {
      console.error('Command requires authentication. Please login first.')
      process.exit(1)
    }
  }

  program.appendOutput = (content) => {
    if (program.output) {
      fs.appendFileSync(program.output, content)
    } else {
      console.log(content)
    }
  }

  program.writeOutput = (content) => {
    if (program.output) {
      fs.writeFileSync(program.output, content)
    } else {
      console.log(content)
    }
  }

  program.parse(argv)
}

if (!module.parent) {
  module.exports(process.argv)
}
